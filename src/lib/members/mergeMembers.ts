import { Kysely } from "kysely";

import { DB } from "@/@types/db";
import { NoDataError, ValidationError } from "@/lib/error";
import { addEvent } from "@/lib/events";
import { db as database } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";
import {
  MemberMergeCounts,
  MemberMergeResult,
  MemberMergeSide,
} from "@/models/memberMerge";

export type { MemberMergeCounts, MemberMergeResult, MemberMergeSide };

/**
 * Fusion de deux fiches d'une même personne : tout ce qui est rattaché à la
 * fiche absorbée passe sur la fiche gardée, puis la fiche absorbée est
 * supprimée. Les champs de la fiche gardée (nom, emails, bio…) ne bougent pas.
 *
 * Hors fusion, volontairement : la boîte mail @beta.gouv.fr de la fiche
 * absorbée (aucun appel à l'API mail) et sa fiche auteur sur beta.gouv.fr.
 */

// Lever cette erreur dans la transaction l'annule : l'aperçu exécute
// exactement la fusion, compte ce qu'elle déplace, puis revient en arrière.
class DryRunRollback extends Error {
  constructor(public readonly result: MemberMergeResult) {
    super("dry run");
  }
}

const updated = (r: { numUpdatedRows: bigint } | undefined) =>
  Number(r?.numUpdatedRows ?? 0);

export async function mergeMembers(
  {
    keepUuid,
    absorbedUuid,
    adminUsername,
    dryRun = false,
  }: {
    keepUuid: string;
    absorbedUuid: string;
    adminUsername: string;
    dryRun?: boolean;
  },
  db: Kysely<DB> = database,
): Promise<MemberMergeResult> {
  if (keepUuid === absorbedUuid) {
    throw new ValidationError("Choisis deux fiches différentes.");
  }
  try {
    return await db.transaction().execute(async (trx) => {
      const users = await trx
        .selectFrom("users")
        .select([
          "uuid",
          "username",
          "fullname",
          "primary_email",
          "secondary_email",
        ])
        .where("uuid", "in", [keepUuid, absorbedUuid])
        .forUpdate()
        .execute();
      const missionEnds = await trx
        .selectFrom("missions")
        .select(["user_id", (eb) => eb.fn.max("end").as("last_end")])
        .where("user_id", "in", [keepUuid, absorbedUuid])
        .groupBy("user_id")
        .execute();
      const side = (uuid: string): MemberMergeSide | undefined => {
        const user = users.find((u) => u.uuid === uuid);
        if (!user) return undefined;
        const end = missionEnds.find((m) => m.user_id === uuid)?.last_end;
        return { ...user, last_mission_end: end ? new Date(end) : null };
      };
      const keep = side(keepUuid);
      const absorbed = side(absorbedUuid);
      if (!keep || !absorbed) {
        throw new NoDataError("Une des deux fiches n'existe plus.");
      }
      if (absorbed.username === adminUsername) {
        throw new ValidationError(
          "Tu ne peux pas absorber ta propre fiche : garde-la et absorbe l'autre.",
        );
      }

      const counts: MemberMergeCounts = {
        missions: updated(
          await trx
            .updateTable("missions")
            .set({ user_id: keep.uuid })
            .where("user_id", "=", absorbed.uuid)
            .executeTakeFirst(),
        ),
        // Une équipe ou une étape déjà présente sur la fiche gardée n'est pas
        // dupliquée (contraintes uniques) : la ligne de la fiche absorbée part
        // avec elle, en cascade.
        teams: updated(
          await trx
            .updateTable("users_teams")
            .set({ user_id: keep.uuid })
            .where("user_id", "=", absorbed.uuid)
            .where("team_id", "not in", (eb) =>
              eb
                .selectFrom("users_teams as kept")
                .select("kept.team_id")
                .where("kept.user_id", "=", keep.uuid),
            )
            .executeTakeFirst(),
        ),
        userEvents: updated(
          await trx
            .updateTable("user_events")
            .set({ user_id: keep.uuid })
            .where("user_id", "=", absorbed.uuid)
            .where("field_id", "not in", (eb) =>
              eb
                .selectFrom("user_events as kept")
                .select("kept.field_id")
                .where("kept.user_id", "=", keep.uuid),
            )
            .executeTakeFirst(),
        ),
        dinumEmails: updated(
          await trx
            .updateTable("dinum_emails")
            .set({ user_id: keep.uuid })
            .where("user_id", "=", absorbed.uuid)
            .executeTakeFirst(),
        ),
        // Un seul compte Tchap par fiche : celui de la fiche gardée l'emporte.
        matrixAccount: updated(
          await trx
            .updateTable("matrix_accounts")
            .set({ user_id: keep.uuid, updated_at: new Date() })
            .where("user_id", "=", absorbed.uuid)
            .where((eb) =>
              eb.not(
                eb.exists(
                  eb
                    .selectFrom("matrix_accounts as kept")
                    .select("kept.id")
                    .where("kept.user_id", "=", keep.uuid),
                ),
              ),
            )
            .executeTakeFirst(),
        ),
        apiKeys: 0,
        // Un compte de service d'un type déjà présent sur la fiche gardée
        // n'est pas déplacé : le code lit un seul compte par type et par fiche.
        serviceAccounts: updated(
          await trx
            .updateTable("service_accounts")
            .set({ user_id: keep.uuid })
            .where("user_id", "=", absorbed.uuid)
            .where("account_type", "not in", (eb) =>
              eb
                .selectFrom("service_accounts as kept")
                .select("kept.account_type")
                .where("kept.user_id", "=", keep.uuid),
            )
            .executeTakeFirst(),
        ),
        startupContacts: 0,
        startupFiles: 0,
        formations: 0,
        badgeRequests: updated(
          await trx
            .updateTable("badge_requests")
            .set({ username: keep.username })
            .where("username", "=", absorbed.username)
            .executeTakeFirst(),
        ),
        events: 0,
      };

      // created_by_user_id est en ON DELETE RESTRICT et owner_user_id en
      // CASCADE : sans ces mises à jour, la suppression échoue ou emporte les
      // clefs.
      for (const column of [
        "owner_user_id",
        "created_by_user_id",
        "revoked_by_user_id",
      ] as const) {
        counts.apiKeys += updated(
          await trx
            .updateTable("api_keys")
            .set({ [column]: keep.uuid })
            .where(column, "=", absorbed.uuid)
            .executeTakeFirst(),
        );
      }

      // Clefs étrangères sans ON DELETE : la suppression échouerait.
      for (const column of ["contact_incubator", "contact_dinum"] as const) {
        counts.startupContacts += updated(
          await trx
            .updateTable("startups")
            .set({ [column]: keep.uuid })
            .where(column, "=", absorbed.uuid)
            .executeTakeFirst(),
        );
      }

      for (const column of ["created_by", "deleted_by"] as const) {
        counts.startupFiles += updated(
          await trx
            .updateTable("startups_files")
            .set({ [column]: keep.uuid })
            .where(column, "=", absorbed.uuid)
            .executeTakeFirst(),
        );
      }

      // users_formations référence users.username sans ON DELETE : on déplace
      // les inscriptions absentes de la fiche gardée et on supprime le reste.
      counts.formations = updated(
        await trx
          .updateTable("users_formations")
          .set({ username: keep.username })
          .where("username", "=", absorbed.username)
          .where((eb) =>
            eb.or([
              eb("formation_id", "is", null),
              eb(
                "formation_id",
                "not in",
                eb
                  .selectFrom("users_formations as kept")
                  .select("kept.formation_id")
                  .where("kept.username", "=", keep.username)
                  .where("kept.formation_id", "is not", null)
                  .$narrowType<{ formation_id: string }>(),
              ),
            ]),
          )
          .executeTakeFirst(),
      );
      await trx
        .deleteFrom("users_formations")
        .where("username", "=", absorbed.username)
        .execute();

      // L'historique de la fiche absorbée s'affiche désormais sur la fiche
      // gardée.
      for (const column of [
        "action_on_username",
        "created_by_username",
      ] as const) {
        counts.events += updated(
          await trx
            .updateTable("events")
            .set({ [column]: keep.username })
            .where(column, "=", absorbed.username)
            .executeTakeFirst(),
        );
      }

      // Connexions de la fiche absorbée : rattachées à son username, elles
      // n'ont plus de sens. Le cache Mattermost se reconstruit seul.
      await trx
        .deleteFrom("sessions")
        .where("userId", "=", absorbed.username)
        .execute();
      await trx
        .deleteFrom("accounts")
        .where("userId", "=", absorbed.username)
        .execute();
      await trx
        .deleteFrom("mattermost_member_infos")
        .where("username", "=", absorbed.username)
        .execute();

      // Le reste (équipes, étapes, Tchap, comptes de service en doublon)
      // part en cascade.
      await trx.deleteFrom("users").where("uuid", "=", absorbed.uuid).execute();

      const result = { keep, absorbed, counts };

      await addEvent(
        {
          action_code: EventCode.MEMBER_MERGED,
          created_by_username: adminUsername,
          action_on_username: keep.username,
          action_metadata: {
            value: {
              absorbed_username: absorbed.username,
              absorbed_uuid: absorbed.uuid,
              absorbed_fullname: absorbed.fullname,
              absorbed_primary_email: absorbed.primary_email,
              counts,
            },
          },
        },
        trx,
      );

      if (dryRun) throw new DryRunRollback(result);
      return result;
    });
  } catch (e) {
    if (e instanceof DryRunRollback) return e.result;
    throw e;
  }
}

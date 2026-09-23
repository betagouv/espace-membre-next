import { sql } from "kysely";
import PgBoss from "pg-boss";

import { getLivingIncubatorTeamMembers } from "@/lib/authorization/incubator";
import { sendEmail } from "@/server/config/email.config";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode, SYSTEM_NAME } from "@/models/actionEvent/actionEvent";
import { CommunicationEmailCode } from "@/models/member";
import { EMAIL_TYPES } from "@/lib/email/email";
import { getAdmin } from "@/server/config/admin.config";
import { getBlockedApiKeyUsers } from "@/server/config/apiKeys.config";
import { getBaseUrl } from "@/lib/url";

export const apiKeysMaintenanceTopic = "api-keys-maintenance";

const UNUSED_DAYS = 180;
// Paliers comptes depuis la date de reference et non depuis le rappel precedent :
// lecture litterale des deux paliers, et le job reste idempotent meme si une
// execution saute un jour.
const REMINDER_STAGES = [90, 180] as const;

/**
 * Date de reference des rappels : max(created_at, confirmed_at). Sans elle, une
 * confirmation remettrait reminder_stage a 0 tout en laissant l'echeance ancree
 * sur created_at, donc une clef de plus de 180 jours confirmee ce matin
 * recevrait ses DEUX rappels des la prochaine execution. GREATEST plutot qu'un
 * COALESCE seul : le CHECK chk_api_keys_confirmed_at interdit deja une
 * confirmation anterieure a la creation, ce predicat ne depend pas de lui.
 */
const reminderReference = sql<Date>`greatest(
  api_keys.created_at,
  coalesce(api_keys.confirmed_at, api_keys.created_at)
)`;

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 3600 * 1000);

type RevocationReason = "unused" | "blocked_owner" | "perimeter_gone";

async function traceAutoRevocation(
  rows: { uuid: string; token_prefix: string }[],
  reason: RevocationReason,
) {
  for (const row of rows) {
    await addEvent({
      action_code: EventCode.API_KEY_AUTO_REVOKED,
      created_by_username: SYSTEM_NAME,
      action_metadata: {
        key_uuid: row.uuid,
        token_prefix: row.token_prefix,
        reason,
      },
    });
  }
}

/**
 * Porteurs bloques. Cette revocation n'est que la trace : le refus a deja lieu a
 * l'authentification, qui relit la liste a chaque requete.
 */
export async function revokeBlockedOwners() {
  const blocked = getBlockedApiKeyUsers();
  // Un where(col, "in", []) genere un IN () invalide en Postgres.
  if (!blocked.length) return 0;

  const rows = await db
    .updateTable("api_keys")
    .set({
      revoked_at: new Date(),
      revoked_reason: "blocked_owner",
      updated_at: new Date(),
    })
    .where("api_keys.kind", "=", "personal")
    .where("api_keys.revoked_at", "is", null)
    .where((eb) =>
      eb.exists(
        eb
          .selectFrom("users")
          .select("users.uuid")
          .whereRef("users.uuid", "=", "api_keys.owner_user_id")
          .where("users.username", "in", blocked),
      ),
    )
    .returning(["api_keys.uuid", "api_keys.token_prefix"])
    .execute();

  await traceAutoRevocation(rows, "blocked_owner");
  return rows.length;
}

/**
 * Perimetres dont la cible a disparu : aucune clef etrangere sur les perimetres,
 * c'est ce balayage qui rattrape. owner_incubator_id n'a pas besoin d'etre
 * balaye, il porte une FK ON DELETE CASCADE.
 */
export async function revokeMissingPerimeters() {
  const rows = await db
    .updateTable("api_keys")
    .set({
      revoked_at: new Date(),
      revoked_reason: "perimeter_gone",
      updated_at: new Date(),
    })
    .where("api_keys.revoked_at", "is", null)
    .where((eb) =>
      eb.or([
        eb.and([
          eb("api_keys.read_perimeter_kind", "=", "incubator"),
          eb.not(
            eb.exists(
              eb
                .selectFrom("incubators")
                .select("incubators.uuid")
                .whereRef("incubators.uuid", "=", "api_keys.read_perimeter_id"),
            ),
          ),
        ]),
        eb.and([
          eb("api_keys.read_perimeter_kind", "=", "startup"),
          eb.not(
            eb.exists(
              eb
                .selectFrom("startups")
                .select("startups.uuid")
                .whereRef("startups.uuid", "=", "api_keys.read_perimeter_id"),
            ),
          ),
        ]),
        eb.and([
          eb("api_keys.write_perimeter_kind", "=", "incubator"),
          eb.not(
            eb.exists(
              eb
                .selectFrom("incubators")
                .select("incubators.uuid")
                .whereRef(
                  "incubators.uuid",
                  "=",
                  "api_keys.write_perimeter_id",
                ),
            ),
          ),
        ]),
        eb.and([
          eb("api_keys.write_perimeter_kind", "=", "startup"),
          eb.not(
            eb.exists(
              eb
                .selectFrom("startups")
                .select("startups.uuid")
                .whereRef("startups.uuid", "=", "api_keys.write_perimeter_id"),
            ),
          ),
        ]),
      ]),
    )
    .returning(["api_keys.uuid", "api_keys.token_prefix"])
    .execute();

  await traceAutoRevocation(rows, "perimeter_gone");
  return rows.length;
}

/**
 * Inactivite 180 jours. Une clef jamais utilisee compte depuis sa creation.
 * last_used_at etant ecrit a l'heure pres, un decalage d'une heure sur 180 jours
 * est sans consequence.
 */
export async function revokeUnused() {
  const threshold = daysAgo(UNUSED_DAYS);
  const rows = await db
    .updateTable("api_keys")
    .set({
      revoked_at: new Date(),
      revoked_reason: "unused",
      updated_at: new Date(),
    })
    .where("api_keys.revoked_at", "is", null)
    .where((eb) =>
      eb.or([
        eb("api_keys.last_used_at", "<", threshold),
        eb.and([
          eb("api_keys.last_used_at", "is", null),
          eb("api_keys.created_at", "<", threshold),
        ]),
      ]),
    )
    .returning(["api_keys.uuid", "api_keys.token_prefix"])
    .execute();

  await traceAutoRevocation(rows, "unused");
  return rows.length;
}

// Le choix d'adresse suit la page formations, seul endroit du repo qui bascule
// reellement une adresse d'envoi sur secondary_email. Le repli sur primary_email
// quand secondary_email est vide est un ajout.
export const emailFor = (u: {
  primary_email: string | null;
  secondary_email: string | null;
  communication_email: string | null;
}) =>
  u.communication_email === CommunicationEmailCode.SECONDARY &&
  u.secondary_email
    ? u.secondary_email
    : u.primary_email;

/** Destinataires recalcules a chaque envoi, jamais figes. */
export async function resolveRecipients(key: {
  kind: string;
  owner_user_id: string | null;
  owner_incubator_id: string | null;
}): Promise<string[]> {
  if (key.kind === "personal" && key.owner_user_id) {
    const owner = await db
      .selectFrom("users")
      .select([
        "users.primary_email",
        "users.secondary_email",
        "users.communication_email",
      ])
      .where("users.uuid", "=", key.owner_user_id)
      .executeTakeFirst();
    const email = owner ? emailFor(owner) : null;
    return email ? [email] : [];
  }
  if (key.owner_incubator_id) {
    // Un membre parti hier ne recoit pas le rappel de ce matin, un membre
    // arrive hier le recoit.
    const team = await getLivingIncubatorTeamMembers(key.owner_incubator_id);
    return team
      .map((member) => emailFor(member))
      .filter((email): email is string => !!email);
  }
  // Clef d'application d'organisation : les admins. ESPACE_MEMBRE_ADMIN porte
  // des USERNAMES, pas des adresses : il faut les resoudre, sinon l'envoi part
  // avec des destinataires invalides.
  const usernames = getAdmin();
  if (!usernames.length) return [];
  const admins = await db
    .selectFrom("users")
    .select([
      "users.primary_email",
      "users.secondary_email",
      "users.communication_email",
    ])
    .where("users.username", "in", usernames)
    .execute();
  return admins
    .map((admin) => emailFor(admin))
    .filter((email): email is string => !!email);
}

/**
 * Rappels : uniquement les clefs sans expiration, deux paliers J+90 et J+180
 * comptes depuis max(created_at, confirmed_at). reminder_stage n'est lu par
 * aucun code de revocation : un rappel non lu ne revoque jamais rien.
 */
export async function sendReminders() {
  let sent = 0;
  for (const [index, days] of REMINDER_STAGES.entries()) {
    const stage = index + 1;
    const due = await db
      .selectFrom("api_keys")
      .select([
        "api_keys.uuid",
        "api_keys.kind",
        "api_keys.name",
        "api_keys.token_prefix",
        "api_keys.owner_user_id",
        "api_keys.owner_incubator_id",
        "api_keys.created_at",
        "api_keys.confirmed_at",
      ])
      .where("api_keys.revoked_at", "is", null)
      .where("api_keys.expires_at", "is", null)
      .where("api_keys.reminder_stage", "=", stage - 1)
      .where(reminderReference, "<=", daysAgo(days))
      .execute();

    for (const key of due) {
      const recipients = await resolveRecipients(key);
      // Un palier ne se consomme que sur un envoi REEL : sans destinataire
      // resolvable, la clef reste due et le rappel repartira, au lieu d'epuiser
      // silencieusement ses deux paliers sans que personne n'ait rien recu.
      if (!recipients.length) continue;
      {
        await sendEmail({
          type: EMAIL_TYPES.EMAIL_API_KEY_REMINDER,
          toEmail: recipients,
          variables: {
            event: "reminder",
            keyName: key.name,
            tokenPrefix: key.token_prefix,
            kindLabel:
              key.kind === "personal"
                ? "clef personnelle"
                : "clef d'application",
            createdAt: new Date(key.created_at).toLocaleDateString("fr-FR"),
            confirmedAt: key.confirmed_at
              ? new Date(key.confirmed_at).toLocaleDateString("fr-FR")
              : null,
            // Age depuis la date de reference, donc depuis la confirmation
            // quand il y en a une : c'est le palier lui-meme.
            ageInDays: days,
            manageUrl: `${getBaseUrl()}/account/api-keys/${key.uuid}`,
            confirmUrl: `${getBaseUrl()}/account/api-keys/${key.uuid}?action=confirm`,
            revokeUrl: `${getBaseUrl()}/account/api-keys/${key.uuid}?action=revoke`,
          },
        });
        sent++;
      }
      await db
        .updateTable("api_keys")
        .set({
          reminder_stage: stage,
          reminder_last_sent_at: new Date(),
          updated_at: new Date(),
        })
        .where("uuid", "=", key.uuid)
        .execute();
    }
  }
  return sent;
}

export async function apiKeysMaintenance(job?: PgBoss.Job<void>) {
  console.log("apiKeysMaintenance: start");
  // Les revocations passent avant les rappels : on ne rappelle jamais une clef
  // revoquee dans la meme execution.
  const blocked = await revokeBlockedOwners();
  const gone = await revokeMissingPerimeters();
  const unused = await revokeUnused();
  const reminded = await sendReminders();
  console.log(
    `apiKeysMaintenance: blocked=${blocked} perimeter_gone=${gone} unused=${unused} reminders=${reminded}`,
  );
}

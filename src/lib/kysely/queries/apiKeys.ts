import { Insertable, Kysely, sql } from "kysely";

import { DB } from "@/@types/db";
import { db as database, jsonArrayFrom } from "@/lib/kysely";

// Regle du module : aucune requete de listing ne selectionne token_hash et
// aucune ne fait de selectAll() sur api_keys. findApiKeyByHash est le seul
// endroit du code qui touche cette colonne, en comparaison, jamais en
// projection.

// Le ghid du perimetre est resolu en SQL : il part dans meta.perimeter de chaque
// reponse, une requete de plus par appel serait du gaspillage. Il rend null
// quand la cible a disparu (aucune clef etrangere) : c'est le signal que
// toApiKeyContext convertit en rejet de la clef.
const perimeterGhid = (kindCol: string, idCol: string) => sql<string | null>`
  case
    when ${sql.ref(kindCol)} = 'incubator'
      then (select i.ghid from incubators i where i.uuid = ${sql.ref(idCol)})
    when ${sql.ref(kindCol)} = 'startup'
      then (select s.ghid from startups s where s.uuid = ${sql.ref(idCol)})
    else null
  end`;

export function findApiKeyByHash(tokenHash: string, db: Kysely<DB> = database) {
  return db
    .selectFrom("api_keys")
    .leftJoin("users as owner", "owner.uuid", "api_keys.owner_user_id")
    .select((eb) => [
      "api_keys.uuid",
      "api_keys.kind",
      "api_keys.scopes",
      "api_keys.token_prefix",
      "api_keys.read_perimeter_kind",
      "api_keys.read_perimeter_id",
      "api_keys.write_perimeter_kind",
      "api_keys.write_perimeter_id",
      "api_keys.expires_at",
      "api_keys.revoked_at",
      "api_keys.last_used_at",
      "api_keys.owner_user_id",
      "api_keys.owner_incubator_id",
      "owner.username as owner_username",
      perimeterGhid(
        "api_keys.read_perimeter_kind",
        "api_keys.read_perimeter_id",
      ).as("read_perimeter_ghid"),
      perimeterGhid(
        "api_keys.write_perimeter_kind",
        "api_keys.write_perimeter_id",
      ).as("write_perimeter_ghid"),
      // Correlee sur owner_user_id : vide pour une clef d'application, ou
      // l'expiration du porteur ne s'evalue jamais.
      jsonArrayFrom(
        eb
          .selectFrom("missions")
          .select(["missions.end"])
          .whereRef("missions.user_id", "=", "api_keys.owner_user_id"),
      )
        .$notNull()
        .as("owner_missions"),
    ])
    .where("api_keys.token_hash", "=", tokenHash)
    .executeTakeFirst();
}

const TOUCH_THROTTLE_MS = 60 * 60 * 1000;

/** last_used_at etrangle a l'heure : sans effet sur un seuil a 180 jours. */
export async function touchApiKey(
  uuid: string,
  lastUsedAt: Date | null,
  db: Kysely<DB> = database,
) {
  const now = new Date();
  if (lastUsedAt && now.getTime() - lastUsedAt.getTime() < TOUCH_THROTTLE_MS)
    return;
  await db
    .updateTable("api_keys")
    .set({ last_used_at: now })
    .where("uuid", "=", uuid)
    .execute();
}

// Seule projection servie a l'UI. token_hash n'y figure pas.
const API_KEY_PUBLIC_COLUMNS = [
  "api_keys.uuid",
  "api_keys.kind",
  "api_keys.name",
  "api_keys.token_prefix",
  "api_keys.scopes",
  "api_keys.read_perimeter_kind",
  "api_keys.read_perimeter_id",
  "api_keys.write_perimeter_kind",
  "api_keys.write_perimeter_id",
  "api_keys.owner_user_id",
  "api_keys.owner_incubator_id",
  "api_keys.expires_at",
  "api_keys.last_used_at",
  "api_keys.revoked_at",
  "api_keys.revoked_reason",
  "api_keys.reminder_stage",
  "api_keys.reminder_last_sent_at",
  "api_keys.confirmed_at",
  "api_keys.created_by_user_id",
  "api_keys.created_at",
] as const;

function apiKeyListQuery(db: Kysely<DB> = database) {
  return db
    .selectFrom("api_keys")
    .select(() => [
      ...API_KEY_PUBLIC_COLUMNS,
      perimeterGhid(
        "api_keys.read_perimeter_kind",
        "api_keys.read_perimeter_id",
      ).as("read_perimeter_ghid"),
      perimeterGhid(
        "api_keys.write_perimeter_kind",
        "api_keys.write_perimeter_id",
      ).as("write_perimeter_ghid"),
    ])
    // Vivantes d'abord, puis les plus recentes : ces ecrans n'ont pas de
    // pagination, le volume par porteur ou par incubateur reste petit.
    .orderBy(sql`api_keys.revoked_at is not null`, "asc")
    .orderBy("api_keys.created_at", "desc");
}

export function listPersonalApiKeys(ownerUserId: string, db?: Kysely<DB>) {
  return apiKeyListQuery(db)
    .where("api_keys.kind", "=", "personal")
    .where("api_keys.owner_user_id", "=", ownerUserId)
    .execute();
}

export function listIncubatorApiKeys(incubatorUuid: string, db?: Kysely<DB>) {
  return apiKeyListQuery(db)
    .where("api_keys.kind", "=", "service")
    .where("api_keys.owner_incubator_id", "=", incubatorUuid)
    .execute();
}

/** Ecran admin : les trois filtres, tous optionnels. */
export function listAllApiKeys(
  filters: {
    kind?: "personal" | "service";
    state?: "live" | "revoked" | "expired";
    incubatorUuid?: string;
  } = {},
  db?: Kysely<DB>,
) {
  let query = apiKeyListQuery(db);
  if (filters.kind) query = query.where("api_keys.kind", "=", filters.kind);
  if (filters.incubatorUuid) {
    query = query.where(
      "api_keys.owner_incubator_id",
      "=",
      filters.incubatorUuid,
    );
  }
  if (filters.state === "revoked") {
    query = query.where("api_keys.revoked_at", "is not", null);
  }
  if (filters.state === "expired") {
    query = query
      .where("api_keys.revoked_at", "is", null)
      .where("api_keys.expires_at", "<=", new Date());
  }
  if (filters.state === "live") {
    query = query.where("api_keys.revoked_at", "is", null).where((eb) =>
      eb.or([
        eb("api_keys.expires_at", "is", null),
        eb("api_keys.expires_at", ">", new Date()),
      ]),
    );
  }
  return query.execute();
}

/** Page de detail et de confirmation : une clef, sous la meme projection. */
export function getApiKeyForOwner(uuid: string, db?: Kysely<DB>) {
  return apiKeyListQuery(db)
    .where("api_keys.uuid", "=", uuid)
    .executeTakeFirst();
}

/** Juste ce qu'il faut a assertCanRevokeApiKey : ni scopes, ni hash. */
export function findApiKeyOwnership(uuid: string, db: Kysely<DB> = database) {
  return db
    .selectFrom("api_keys")
    .select([
      "api_keys.uuid",
      "api_keys.kind",
      "api_keys.name",
      "api_keys.token_prefix",
      "api_keys.owner_user_id",
      "api_keys.owner_incubator_id",
      "api_keys.revoked_at",
    ])
    .where("api_keys.uuid", "=", uuid)
    .executeTakeFirst();
}

/** Le hash arrive deja calcule : ce module ne voit jamais le jeton clair. */
export function insertApiKey(
  values: Insertable<DB["api_keys"]>,
  db: Kysely<DB> = database,
) {
  return db
    .insertInto("api_keys")
    .values(values)
    .returning(["uuid", "token_prefix", "created_at"])
    .executeTakeFirstOrThrow();
}

/** Idempotent : une clef deja revoquee garde sa revocation d'origine. */
export function revokeApiKey(
  uuid: string,
  revokedByUserId: string,
  reason: string,
  db: Kysely<DB> = database,
) {
  const now = new Date();
  return db
    .updateTable("api_keys")
    .set({
      revoked_at: now,
      revoked_by_user_id: revokedByUserId,
      // chk_api_keys_revocation : revoked_at et revoked_reason vont ensemble.
      revoked_reason: reason,
      updated_at: now,
    })
    .where("uuid", "=", uuid)
    .where("revoked_at", "is", null)
    .returning(["uuid", "revoked_at"])
    .executeTakeFirst();
}

/**
 * Confirmation par le porteur : rend deux paliers de rappel a une clef sans
 * expiration. Ne prolonge rien d'autre et ne touche pas a last_used_at.
 *
 * confirmed_at est la date DEPUIS laquelle les paliers se recomptent : remettre
 * reminder_stage a 0 sans elle laisserait l'echeance ancree sur created_at, donc
 * les deux rappels repartiraient immediatement, tous les deux, des le lendemain
 * de la confirmation d'une clef de plus de 180 jours.
 */
export function confirmApiKey(uuid: string, db: Kysely<DB> = database) {
  const now = new Date();
  return db
    .updateTable("api_keys")
    .set({
      reminder_stage: 0,
      reminder_last_sent_at: null,
      confirmed_at: now,
      updated_at: now,
    })
    .where("uuid", "=", uuid)
    .where("revoked_at", "is", null)
    .returning(["uuid"])
    .executeTakeFirst();
}

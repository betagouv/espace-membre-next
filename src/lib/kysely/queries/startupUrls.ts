import { ExpressionBuilder, Kysely } from "kysely";

import { DB } from "@/@types/db";
import { db, jsonArrayFrom } from "@/lib/kysely";
import {
  LEGACY_STARTUP_URL_COLUMNS,
  LegacyStartupUrlType,
  primaryStartupUrl,
  StartupUrl,
  StartupUrlType,
  startupUrlSchemaType,
} from "@/models/startupUrl";

/**
 * startup_urls est la source de vérité des liens d'un produit. Toute écriture
 * passe par ce module, qui recopie dans la même transaction le premier lien de
 * chaque type dans la colonne historique de startups. Ces colonnes ne sont
 * plus lues par l'application : elles restent pour un retour arrière et pour
 * les requêtes SQL externes, jusqu'à leur suppression.
 */

// Ordre d'affichage : position, puis date et uuid pour départager les liens
// d'une même position sans ordre aléatoire.
export const withStartupUrls = (eb: ExpressionBuilder<DB, "startups">) =>
  jsonArrayFrom(
    eb
      .selectFrom("startup_urls")
      .select(["startup_urls.type", "startup_urls.label", "startup_urls.url"])
      .whereRef("startup_urls.startup_uuid", "=", "startups.uuid")
      .orderBy("startup_urls.position", "asc")
      .orderBy("startup_urls.created_at", "asc")
      .orderBy("startup_urls.uuid", "asc"),
  )
    .$castTo<StartupUrl[]>()
    .$notNull()
    .as("urls");

/** Sous-requete du premier lien d'un type, au meme ordre que withStartupUrls. */
export const primaryStartupUrlOf = (
  eb: ExpressionBuilder<DB, "startups">,
  type: StartupUrlType,
) =>
  eb
    .selectFrom("startup_urls")
    .select("startup_urls.url")
    .whereRef("startup_urls.startup_uuid", "=", "startups.uuid")
    .where("startup_urls.type", "=", type)
    .orderBy("startup_urls.position", "asc")
    .orderBy("startup_urls.created_at", "asc")
    .orderBy("startup_urls.uuid", "asc")
    .limit(1);

export async function getStartupUrls(
  startupUuid: string,
  executor: Kysely<DB> = db,
): Promise<StartupUrl[]> {
  const rows = await executor
    .selectFrom("startup_urls")
    .select(["type", "label", "url"])
    .where("startup_uuid", "=", startupUuid)
    .orderBy("position", "asc")
    .orderBy("created_at", "asc")
    .orderBy("uuid", "asc")
    .execute();
  return rows as StartupUrl[];
}

// Les écritures de liens lisent puis écrivent : sans ce verrou, deux écritures
// concurrentes sur le même produit dupliqueraient un lien ou en perdraient un.
// NO KEY UPDATE et non UPDATE : FOR UPDATE bloquerait les contrôles de clé
// étrangère vers startups, dont l'insertion d'un événement hors transaction
// pendant que celle-ci est ouverte.
async function lockStartup(trx: Kysely<DB>, startupUuid: string) {
  await trx
    .selectFrom("startups")
    .select("uuid")
    .where("uuid", "=", startupUuid)
    .forNoKeyUpdate()
    .execute();
}

async function syncLegacyUrlColumns(trx: Kysely<DB>, startupUuid: string) {
  const urls = await getStartupUrls(startupUuid, trx);
  const values = Object.fromEntries(
    Object.entries(LEGACY_STARTUP_URL_COLUMNS).map(([type, column]) => [
      column,
      primaryStartupUrl(urls, type as LegacyStartupUrlType),
    ]),
  );
  await trx
    .updateTable("startups")
    .set(values)
    .where("uuid", "=", startupUuid)
    .execute();
}

/** Remplace toute la liste, dans l'ordre fourni. */
export async function replaceStartupUrls(
  trx: Kysely<DB>,
  startupUuid: string,
  urls: startupUrlSchemaType[],
) {
  await lockStartup(trx, startupUuid);
  await trx
    .deleteFrom("startup_urls")
    .where("startup_uuid", "=", startupUuid)
    .execute();
  const rows = urls
    .map(({ type, label, url }) => ({
      type,
      label: label?.trim() || null,
      url: url.trim(),
    }))
    .filter(({ url }) => url !== "")
    .map((startupUrl, position) => ({
      ...startupUrl,
      startup_uuid: startupUuid,
      position,
    }));
  if (rows.length) {
    await trx.insertInto("startup_urls").values(rows).execute();
  }
  await syncLegacyUrlColumns(trx, startupUuid);
}

/**
 * Écrit le premier lien d'un type, comme le faisaient les anciennes colonnes :
 * les autres liens du même type sont conservés. null (ou une chaîne vide)
 * supprime ce premier lien, le suivant prend alors sa place.
 */
export async function setPrimaryStartupUrl(
  trx: Kysely<DB>,
  startupUuid: string,
  type: StartupUrlType,
  url: string | null,
) {
  const value = url?.trim() || null;
  await lockStartup(trx, startupUuid);
  const primary = await trx
    .selectFrom("startup_urls")
    .select(["uuid", "url"])
    .where("startup_uuid", "=", startupUuid)
    .where("type", "=", type)
    .orderBy("position", "asc")
    .orderBy("created_at", "asc")
    .orderBy("uuid", "asc")
    .limit(1)
    .executeTakeFirst();

  if (!value) {
    if (primary) {
      await trx
        .deleteFrom("startup_urls")
        .where("uuid", "=", primary.uuid)
        .execute();
    }
  } else if (primary) {
    // Le libellé décrivait l'ancien lien : il ne suit pas un changement d'URL.
    await trx
      .updateTable("startup_urls")
      .set({
        url: value,
        ...(primary.url !== value && { label: null }),
        updated_at: new Date(),
      })
      .where("uuid", "=", primary.uuid)
      .execute();
  } else {
    const { max } = await trx
      .selectFrom("startup_urls")
      .select((eb) => eb.fn.max("position").as("max"))
      .where("startup_uuid", "=", startupUuid)
      .executeTakeFirstOrThrow();
    await trx
      .insertInto("startup_urls")
      .values({
        startup_uuid: startupUuid,
        type,
        url: value,
        position: max === null ? 0 : Number(max) + 1,
      })
      .execute();
  }
  await syncLegacyUrlColumns(trx, startupUuid);
}

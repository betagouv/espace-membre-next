import { NextRequest } from "next/server";

import { generateApiKeyToken } from "@/lib/api-keys/token";
import { db } from "@/lib/kysely";
import { ApiScope } from "@/models/api/scope";

type PerimeterInput =
  | { kind: "global" }
  | { kind: "incubator" | "startup"; uuid: string };

/**
 * Insere une VRAIE clef en base et rend le jeton clair : les tests d'API
 * traversent donc withApiV1 en entier, perimetre compris.
 */
export async function createTestApiKey({
  scopes,
  read = { kind: "global" },
  write = null,
  name = "test key",
  kind = "service",
  ownerUserId = null,
}: {
  scopes: ApiScope[];
  read?: PerimeterInput;
  write?: PerimeterInput | null;
  name?: string;
  // chk_api_keys_owner : une clef `personal` EXIGE un owner_user_id et interdit
  // owner_incubator_id. Sans ces deux parametres, aucun test ne pouvait forger
  // de clef personnelle, donc l'etage porteur bloque / porteur expire de
  // authenticateApiKey n'etait atteint par rien.
  kind?: "personal" | "service";
  ownerUserId?: string | null;
}) {
  // created_by_user_id est en ON DELETE RESTRICT : il faut un porteur reel.
  // Les jeux de donnees ne sont pas tous crees au moment ou la clef est forgee,
  // d'ou ce compte technique cree a la demande.
  const creator =
    (await db
      .selectFrom("users")
      .select("users.uuid")
      .where("users.username", "=", "test-api-key-owner")
      .executeTakeFirst()) ??
    (await db
      .insertInto("users")
      .values({
        username: "test-api-key-owner",
        fullname: "Test Api Key Owner",
        primary_email: "test-api-key-owner@beta.gouv.fr",
        domaine: "Autre",
        role: "Test",
      })
      .returning("users.uuid")
      .executeTakeFirstOrThrow());

  const { token, tokenHash, tokenPrefix } = generateApiKeyToken();
  const inserted = await db
    .insertInto("api_keys")
    .values({
      kind,
      owner_user_id: kind === "personal" ? (ownerUserId ?? creator.uuid) : null,
      name,
      token_hash: tokenHash,
      token_prefix: tokenPrefix,
      scopes,
      read_perimeter_kind: read.kind,
      read_perimeter_id: read.kind === "global" ? null : read.uuid,
      write_perimeter_kind: write ? write.kind : null,
      write_perimeter_id: write && write.kind !== "global" ? write.uuid : null,
      created_by_user_id: creator.uuid,
    })
    .returning(["uuid"])
    .executeTakeFirstOrThrow();

  return { token, uuid: inserted.uuid };
}

export async function deleteTestApiKey(uuid: string) {
  await db.deleteFrom("api_keys").where("uuid", "=", uuid).execute();
}

/** Requete v1 authentifiee, en Bearer, comme un vrai client. */
export const apiRequest = (token: string, url: string) =>
  new NextRequest(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

/**
 * Ecriture authentifiee. NextRequest et non Request : le wrapper lit
 * req.nextUrl, qu'un Request standard ne porte pas.
 */
export const apiWriteRequest = (
  token: string,
  url: string,
  method: "PUT" | "PATCH" | "POST",
  contentType: string,
  body: unknown,
) =>
  new NextRequest(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body: JSON.stringify(body),
  });

"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanCreatePersonalKey,
  assertPerimetersAllowed,
} from "@/lib/authorization/apiKey";
import { generateApiKeyToken } from "@/lib/api-keys/token";
import { UnwrapPromise, withErrorHandling } from "@/lib/error";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { insertApiKey } from "@/lib/kysely/queries/apiKeys";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { ApiKeyCreate, apiKeyCreateSchema } from "@/models/api/apiKey";

import { perimeterLabelOf, toDbPerimeter } from "./perimeter";

/**
 * Le jeton clair est renvoye ICI et une seule fois : il n'est ni stocke, ni
 * relisible, ni journalise. Seuls token_hash et token_prefix vont en base.
 */
export async function createPersonalApiKey(
  input: ApiKeyCreate,
  ownerUuid: string,
) {
  const data = apiKeyCreateSchema.parse({ ...input, kind: "personal" });
  const subject = await assertCanCreatePersonalKey(ownerUuid);
  await assertPerimetersAllowed(
    subject,
    data.read_perimeter,
    data.write_perimeter,
  );

  const { token, tokenHash, tokenPrefix } = generateApiKeyToken();
  const inserted = await insertApiKey({
    kind: "personal",
    name: data.name,
    token_hash: tokenHash,
    token_prefix: tokenPrefix,
    owner_user_id: ownerUuid,
    scopes: data.scopes,
    ...toDbPerimeter(data.read_perimeter, data.write_perimeter),
    expires_at: data.expires_at,
    created_by_user_id: subject.uuid,
  });

  // L'historique d'un membre est lu par action_on_username, jamais par
  // created_by_username : sans ce champ la creation d'une clef personnelle
  // n'apparait sur la fiche de personne, meme quand le porteur la cree lui-meme.
  const owner = await db
    .selectFrom("users")
    .select("users.username")
    .where("users.uuid", "=", ownerUuid)
    .executeTakeFirst();

  await addEvent({
    action_code: EventCode.API_KEY_CREATED,
    created_by_username: subject.username,
    ...(owner && { action_on_username: owner.username }),
    action_metadata: {
      key_uuid: inserted.uuid,
      token_prefix: inserted.token_prefix,
      kind: "personal",
      name: data.name,
      scopes: data.scopes.join(","),
      read_perimeter: await perimeterLabelOf(data.read_perimeter),
      ...(data.write_perimeter && {
        write_perimeter: await perimeterLabelOf(data.write_perimeter),
      }),
      ...(data.expires_at && { expires_at: data.expires_at.toISOString() }),
    },
  });

  revalidatePath("/account");
  return { uuid: inserted.uuid, token, token_prefix: inserted.token_prefix };
}

export const safeCreatePersonalApiKey = withErrorHandling<
  UnwrapPromise<ReturnType<typeof createPersonalApiKey>>,
  Parameters<typeof createPersonalApiKey>
>(createPersonalApiKey);

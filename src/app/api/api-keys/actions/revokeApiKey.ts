"use server";

import { revalidatePath } from "next/cache";

import { assertCanRevokeApiKey } from "@/lib/authorization/apiKey";
import { NoDataError, UnwrapPromise, withErrorHandling } from "@/lib/error";
import { addEvent } from "@/lib/events";
import {
  findApiKeyOwnership,
  revokeApiKey as revokeApiKeyQuery,
} from "@/lib/kysely/queries/apiKeys";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { ApiKeyRevoke, apiKeyRevokeSchema } from "@/models/api/apiKey";
import { apiKeyKindSchema } from "@/models/api/apiKey";

export async function revokeApiKey(input: ApiKeyRevoke) {
  const { uuid, revoked_reason } = apiKeyRevokeSchema.parse(input);

  const key = await findApiKeyOwnership(uuid);
  if (!key) throw new NoDataError("Cannot find api key");

  const subject = await assertCanRevokeApiKey({
    kind: apiKeyKindSchema.parse(key.kind),
    owner_user_id: key.owner_user_id,
    owner_incubator_id: key.owner_incubator_id,
  });

  // Idempotent : une clef deja revoquee garde sa revocation d'origine.
  const revoked = await revokeApiKeyQuery(uuid, subject.uuid, revoked_reason);
  if (revoked) {
    await addEvent({
      action_code: EventCode.API_KEY_REVOKED,
      created_by_username: subject.username,
      action_metadata: {
        key_uuid: uuid,
        token_prefix: key.token_prefix,
        reason: revoked_reason,
      },
    });
  }

  revalidatePath("/account");
  if (key.owner_incubator_id) {
    revalidatePath(`/incubators/${key.owner_incubator_id}/api-keys`);
  }
  return { uuid, revoked: !!revoked };
}

export const safeRevokeApiKey = withErrorHandling<
  UnwrapPromise<ReturnType<typeof revokeApiKey>>,
  Parameters<typeof revokeApiKey>
>(revokeApiKey);

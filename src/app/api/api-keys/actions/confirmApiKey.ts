"use server";

import { revalidatePath } from "next/cache";

import { canRevokeApiKey } from "@/lib/authorization/apiKey";
import { requireAuthSubject } from "@/lib/authorization/subject";
import {
  AuthorizationError,
  NoDataError,
  UnwrapPromise,
  withErrorHandling,
} from "@/lib/error";
import { addEvent } from "@/lib/events";
import {
  confirmApiKey as confirmApiKeyQuery,
  findApiKeyOwnership,
} from "@/lib/kysely/queries/apiKeys";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { apiKeyKindSchema } from "@/models/api/apiKey";

/**
 * Confirmer qu'une clef sert toujours : remet reminder_stage a 0, donc rend deux
 * paliers a une clef sans expiration. Ne prolonge rien d'autre et ne touche pas
 * a last_used_at. Le geste vient d'un bouton, jamais du chargement d'un lien.
 */
export async function confirmApiKey({ uuid }: { uuid: string }) {
  const key = await findApiKeyOwnership(uuid);
  if (!key) throw new NoDataError("Cannot find api key");

  const subject = await requireAuthSubject();
  const allowed = await canRevokeApiKey(subject, {
    kind: apiKeyKindSchema.parse(key.kind),
    owner_user_id: key.owner_user_id,
    owner_incubator_id: key.owner_incubator_id,
  });
  if (!allowed) throw new AuthorizationError();

  const confirmed = await confirmApiKeyQuery(uuid);
  if (confirmed) {
    await addEvent({
      action_code: EventCode.API_KEY_CONFIRMED,
      created_by_username: subject.username,
      action_metadata: { key_uuid: uuid, token_prefix: key.token_prefix },
    });
  }

  revalidatePath(`/account/api-keys/${uuid}`);
  return { uuid, confirmed: !!confirmed };
}

export const safeConfirmApiKey = withErrorHandling<
  UnwrapPromise<ReturnType<typeof confirmApiKey>>,
  Parameters<typeof confirmApiKey>
>(confirmApiKey);

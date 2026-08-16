"use server";

import { revalidatePath } from "next/cache";

import { generateApiKeyToken } from "@/lib/api-keys/token";
import {
  assertCanCreateServiceKey,
  assertPerimetersAllowed,
} from "@/lib/authorization/apiKey";
import { getLivingIncubatorTeamMembers } from "@/lib/authorization/incubator";
import { EMAIL_TYPES } from "@/lib/email/email";
import { UnwrapPromise, withErrorHandling } from "@/lib/error";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { insertApiKey } from "@/lib/kysely/queries/apiKeys";
import { getBaseUrl } from "@/lib/url";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { ApiKeyCreate, apiKeyCreateSchema } from "@/models/api/apiKey";
import { sendEmail } from "@/server/config/email.config";
import { emailFor } from "@/server/queueing/workers/api-keys-maintenance";

import { perimeterLabelOf, toDbPerimeter } from "./perimeter";

export async function createServiceApiKey(input: ApiKeyCreate) {
  const data = apiKeyCreateSchema.parse({ ...input, kind: "service" });
  const subject = await assertCanCreateServiceKey(data.owner_incubator_id);
  await assertPerimetersAllowed(
    subject,
    data.read_perimeter,
    data.write_perimeter,
  );

  const { token, tokenHash, tokenPrefix } = generateApiKeyToken();
  const inserted = await insertApiKey({
    kind: "service",
    name: data.name,
    token_hash: tokenHash,
    token_prefix: tokenPrefix,
    owner_incubator_id: data.owner_incubator_id,
    scopes: data.scopes,
    ...toDbPerimeter(data.read_perimeter, data.write_perimeter),
    expires_at: data.expires_at,
    created_by_user_id: subject.uuid,
  });

  const incubator = data.owner_incubator_id
    ? await db
        .selectFrom("incubators")
        .select(["incubators.ghid"])
        .where("incubators.uuid", "=", data.owner_incubator_id)
        .executeTakeFirst()
    : undefined;

  await addEvent({
    action_code: EventCode.API_KEY_CREATED,
    created_by_username: subject.username,
    action_metadata: {
      key_uuid: inserted.uuid,
      token_prefix: inserted.token_prefix,
      kind: "service",
      name: data.name,
      scopes: data.scopes.join(","),
      read_perimeter: await perimeterLabelOf(data.read_perimeter),
      ...(data.write_perimeter && {
        write_perimeter: await perimeterLabelOf(data.write_perimeter),
      }),
      ...(data.expires_at && { expires_at: data.expires_at.toISOString() }),
      ...(incubator?.ghid && { owner_incubator_ghid: incubator.ghid }),
    },
  });

  // Toute l'equipe vivante de l'incubateur porteur est prevenue : une clef
  // d'application n'a pas de porteur humain unique. L'envoi est HORS du chemin
  // critique : la ligne est deja committee, et un echec de Brevo ne doit pas
  // faire croire a un echec de creation, sinon le jeton clair est perdu alors
  // que la clef existe.
  if (data.owner_incubator_id) {
    try {
      const team = await getLivingIncubatorTeamMembers(data.owner_incubator_id);
      const recipients = team
        .map((member) => emailFor(member))
        .filter((email): email is string => !!email);
      if (recipients.length) {
        await sendEmail({
          type: EMAIL_TYPES.EMAIL_API_KEY_REMINDER,
          toEmail: recipients,
          variables: {
            event: "created",
            keyName: data.name,
            tokenPrefix: inserted.token_prefix,
            kindLabel: "clef d'application",
            createdAt: new Date(inserted.created_at).toLocaleDateString("fr-FR"),
            manageUrl: `${getBaseUrl()}/incubators/${data.owner_incubator_id}/api-keys`,
            scopesLabel: data.scopes.join(", "),
            perimeterLabel: await perimeterLabelOf(data.read_perimeter),
            createdByFullname: subject.username,
          },
        });
      }
    } catch (error) {
      console.error(
        "createServiceApiKey: notification non envoyee pour la clef",
        inserted.uuid,
        error,
      );
    }
    revalidatePath(`/incubators/${data.owner_incubator_id}/api-keys`);
  }

  return { uuid: inserted.uuid, token, token_prefix: inserted.token_prefix };
}

export const safeCreateServiceApiKey = withErrorHandling<
  UnwrapPromise<ReturnType<typeof createServiceApiKey>>,
  Parameters<typeof createServiceApiKey>
>(createServiceApiKey);

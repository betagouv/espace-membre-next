"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { canEditMember } from "@/lib/canEditMember";
import { canValidateRestrictedChecklistItem } from "@/lib/canValidateRestrictedChecklistItem";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { getChecklistObject } from "@/utils/checklists/getChecklistObject";
import { isRestrictedChecklistItem } from "@/utils/checklists/restrictedChecklistItems";
import { authOptions } from "@/utils/authoptions";
import {
  AuthorizationError,
  BusinessError,
  UnwrapPromise,
  withErrorHandling,
} from "@/utils/error";

const updateUserEventSchema = z.object({
  action_on_user_id: z.string().uuid().optional(),
  field_id: z.string().min(1),
  value: z.boolean(),
  date: z.coerce.date().optional(),
});

/**
 * Ids de checklist réellement inscriptibles : ceux des yml, moins les items
 * `disabled` qui ne doivent jamais atterrir en base (computeProgress les compte
 * déjà via son `offset`, une ligne user_events les compterait une seconde fois).
 *
 * Fail-closed : si un yml ne parse pas, getChecklistObject renvoie null après
 * avoir notifié Sentry, et on refuse l'écriture plutôt que de tout accepter.
 */
async function getWritableChecklistItemIds(): Promise<Set<string>> {
  const checklists = await Promise.all([
    getChecklistObject("onboarding"),
    getChecklistObject("offboarding"),
  ]);
  const ids = new Set<string>();
  for (const checklist of checklists) {
    if (!checklist) {
      throw new BusinessError(
        "ChecklistUnavailable",
        "La checklist est indisponible, l'enregistrement est impossible.",
      );
    }
    for (const section of checklist) {
      for (const item of section.items) {
        if (!item.disabled) {
          ids.add(item.id);
        }
      }
    }
  }
  return ids;
}

export async function updateUserEvent(params: {
  action_on_user_id?: string;
  field_id: string;
  value: boolean;
  date?: Date;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    throw new AuthorizationError();
  }

  const { action_on_user_id, field_id, value, date } =
    updateUserEventSchema.parse(params);

  // Le field_id doit correspondre à un item de checklist existant : sans ça
  // n'importe quel membre peut écrire des lignes user_events arbitraires.
  const writableFieldIds = await getWritableChecklistItemIds();
  if (!writableFieldIds.has(field_id)) {
    throw new BusinessError(
      "UnknownChecklistItem",
      "Cet item de checklist n'existe pas.",
    );
  }

  const user_id = action_on_user_id || session.user.uuid;
  const isSelfEdit = session.user.uuid === user_id;
  const isRestrictedField = isRestrictedChecklistItem(field_id);
  // Relecture de la configuration serveur : jamais un booléen venant du client.
  const canValidateRestricted = canValidateRestrictedChecklistItem(
    session.user.id,
  );

  // Un item réservé n'est ni cochable ni décochable par quelqu'un d'autre que
  // l'équipe d'animation, y compris sur son propre compte.
  if (isRestrictedField && !canValidateRestricted) {
    throw new AuthorizationError(
      "Seule l'équipe d'animation peut valider la participation à l'embarquement.",
    );
  }

  // Defense in depth: only allow editing one's own user events, unless the
  // session user has edit permissions on the target member (admin, same
  // incubator team, or shared startup with contractuel/fonctionnaire status).
  // Exception : l'embarquement est un rituel transverse, l'équipe d'animation
  // doit pouvoir l'attester pour n'importe quel membre. L'exception est
  // strictement limitée aux items réservés.
  if (
    !isSelfEdit &&
    !(isRestrictedField && canValidateRestricted) &&
    !(await canEditMember({ memberUuid: user_id, sessionUser: session.user }))
  ) {
    throw new AuthorizationError();
  }

  const user = await getUserInfos({ uuid: user_id });
  if (!user) {
    throw new BusinessError("UserNotDefined", "User does not exist");
  }
  const eventDate = date || new Date();
  if (!value) {
    await db
      .deleteFrom("user_events")
      .where("field_id", "=", field_id)
      .where("user_id", "=", user_id)
      .execute();
  } else {
    await db
      .insertInto("user_events")
      .values({
        field_id,
        user_id,
        date: eventDate,
      })
      .onConflict((oc) => {
        return oc.column("field_id").column("user_id").doUpdateSet({
          date: eventDate,
        });
      })
      .execute();
  }
  await addEvent({
    action_code: EventCode.MEMBER_USER_EVENTS_UPDATED,
    created_by_username: session.user.id,
    action_on_username: user.username,
    action_metadata: {
      field_id,
      value,
      date: !!value ? eventDate : null,
    },
  });
  revalidatePath(`/account`);
  revalidatePath(`/community/${user.username}`);
}

export const safeUpdateUserEvent = withErrorHandling<
  UnwrapPromise<ReturnType<typeof updateUserEvent>>,
  Parameters<typeof updateUserEvent>
>(updateUserEvent);

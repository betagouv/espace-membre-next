"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { canEditMember } from "@/lib/authorization/member";
import { canValidateRestrictedChecklistItem } from "@/lib/canValidateRestrictedChecklistItem";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { EventCode } from "@/models/actionEvent/actionEvent";
import {
  NOT_CONCERNED_COMMENT_MAX_LENGTH,
  notConcernedSchemaType,
} from "@/models/checklist";
import { authOptions } from "@/lib/authoptions";
import {
  allowedChecklists,
  getChecklistObject,
} from "@/lib/checklists/getChecklistObject";
import {
  AuthorizationError,
  BusinessError,
  UnwrapPromise,
  withErrorHandling,
} from "@/lib/error";

const updateUserEventSchema = z.object({
  action_on_user_id: z.string().uuid().optional(),
  field_id: z.string().min(1),
  value: z.boolean(),
  date: z.coerce.date().optional(),
  // « Non concerné » : l'item est enregistré comme fait, avec un motif.
  not_concerned: z
    .object({
      reason: z.string().min(1),
      comment: z.string().optional(),
    })
    .optional(),
});

/**
 * Etat des items de checklist, lu depuis les yml :
 *
 * - `writable` : les items dont une ligne user_events a un sens. Les items
 *   `disabled` en sont exclus, ils ne doivent jamais atterrir en base
 *   (computeProgress les compte déjà via son `offset`, une ligne les
 *   compterait une seconde fois).
 * - `restricted` : les items marqués `restricted: true`, réservés à l'équipe
 *   d'animation.
 * - `notConcerned` : les items qu'on peut déclarer « non concerné », avec
 *   leurs motifs. Un item partagé par deux yml y a les mêmes motifs (vérifié
 *   par onboardingChecklists.spec.ts).
 *
 * Fail-closed : si un yml ne parse pas, getChecklistObject renvoie null après
 * avoir notifié Sentry, et on refuse toute écriture. C'est ce qui rend sûr le
 * fait de tirer la restriction du yml : un yml cassé bloque tout, il ne peut
 * pas servir à faire sauter la garde.
 *
 * Tous les yml sont lus, quel que soit le domaine du membre : un item propre
 * aux intrapreneur·es doit rester inscriptible, y compris par l'équipe
 * d'animation depuis la fiche d'un autre membre.
 */
async function getChecklistItemIds(): Promise<{
  writable: Set<string>;
  restricted: Set<string>;
  notConcerned: Map<string, notConcernedSchemaType>;
}> {
  const checklists = await Promise.all(
    allowedChecklists.map((type) => getChecklistObject(type)),
  );
  const writable = new Set<string>();
  const restricted = new Set<string>();
  const notConcerned = new Map<string, notConcernedSchemaType>();
  for (const checklist of checklists) {
    if (!checklist) {
      throw new BusinessError(
        "ChecklistUnavailable",
        "La checklist est indisponible, l'enregistrement est impossible.",
      );
    }
    for (const section of checklist) {
      for (const item of section.items) {
        if (item.disabled) continue;
        writable.add(item.id);
        if (item.restricted) {
          restricted.add(item.id);
        }
        if (item.notConcerned && !notConcerned.has(item.id)) {
          notConcerned.set(item.id, item.notConcerned);
        }
      }
    }
  }
  return { writable, restricted, notConcerned };
}

/**
 * Valide la déclaration « non concerné » contre les motifs du yml et renvoie
 * les valeurs à stocker. Sans déclaration, les deux colonnes sont remises à
 * null : cocher l'item comme fait efface un ancien « non concerné ».
 */
function getNotConcernedValues(
  config: notConcernedSchemaType | undefined,
  value: boolean,
  notConcerned: { reason: string; comment?: string } | undefined,
): {
  not_concerned_reason: string | null;
  not_concerned_comment: string | null;
} {
  if (!notConcerned) {
    return { not_concerned_reason: null, not_concerned_comment: null };
  }
  if (!value) {
    throw new BusinessError(
      "NotConcernedWithoutValue",
      "Un item décoché ne peut pas porter de motif.",
    );
  }
  if (!config) {
    throw new BusinessError(
      "NotConcernedUnavailable",
      "Cet item ne peut pas être déclaré non concerné.",
    );
  }
  const reason = config.reasons.find((r) => r.id === notConcerned.reason);
  if (!reason) {
    throw new BusinessError(
      "UnknownNotConcernedReason",
      "Ce motif n'existe pas.",
    );
  }
  const comment = notConcerned.comment?.trim() || null;
  if (reason.commentRequired && !comment) {
    throw new BusinessError(
      "NotConcernedCommentRequired",
      "Précise le motif dans le commentaire.",
    );
  }
  if (comment && comment.length > NOT_CONCERNED_COMMENT_MAX_LENGTH) {
    throw new BusinessError(
      "NotConcernedCommentTooLong",
      `Le commentaire ne doit pas dépasser ${NOT_CONCERNED_COMMENT_MAX_LENGTH} caractères.`,
    );
  }
  return { not_concerned_reason: reason.id, not_concerned_comment: comment };
}

export async function updateUserEvent(params: {
  action_on_user_id?: string;
  field_id: string;
  value: boolean;
  date?: Date;
  not_concerned?: { reason: string; comment?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    throw new AuthorizationError();
  }

  const { action_on_user_id, field_id, value, date, not_concerned } =
    updateUserEventSchema.parse(params);

  // Le field_id doit correspondre à un item de checklist existant : sans ça
  // n'importe quel membre peut écrire des lignes user_events arbitraires.
  const { writable, restricted, notConcerned } = await getChecklistItemIds();
  if (!writable.has(field_id)) {
    throw new BusinessError(
      "UnknownChecklistItem",
      "Cet item de checklist n'existe pas.",
    );
  }

  const user_id = action_on_user_id || session.user.uuid;
  const isSelfEdit = session.user.uuid === user_id;
  const isRestrictedField = restricted.has(field_id);
  // Lu depuis la base et la config serveur : jamais un booléen venant du client.
  const canValidateRestricted = await canValidateRestrictedChecklistItem(
    session.user,
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
  const notConcernedValues = getNotConcernedValues(
    notConcerned.get(field_id),
    value,
    not_concerned,
  );
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
        ...notConcernedValues,
      })
      .onConflict((oc) => {
        return oc
          .column("field_id")
          .column("user_id")
          .doUpdateSet({
            date: eventDate,
            ...notConcernedValues,
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
      ...(value ? notConcernedValues : {}),
    },
  });
  revalidatePath(`/account`);
  revalidatePath(`/community/${user.username}`);
}

export const safeUpdateUserEvent = withErrorHandling<
  UnwrapPromise<ReturnType<typeof updateUserEvent>>,
  Parameters<typeof updateUserEvent>
>(updateUserEvent);

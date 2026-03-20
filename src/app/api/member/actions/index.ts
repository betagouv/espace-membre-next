"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { createMission, updateMission } from "@/lib/kysely/queries/missions";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { getUserByEmail, MattermostUser, searchUsers } from "@/lib/mattermost";
import { EventCode } from "@/models/actionEvent/actionEvent";
import {
  updateMemberMissionsSchema,
  updateMemberMissionsSchemaType,
} from "@/models/actions/member";
import {
  memberBaseInfoToMemberPublicInfoModel,
  memberBaseInfoToModel,
} from "@/models/mapper";
import {
  CommunicationEmailCode,
  memberWrapperPublicInfoSchemaType,
} from "@/models/member";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import {
  updateContactEmail,
  addContactsToMailingLists,
  removeContactsFromMailingList,
} from "@/server/config/email.config";
import { capitalizeWords, userInfos } from "@/server/controllers/utils";
import { Contact, MAILING_LIST_TYPE } from "@/server/modules/email";
import { authOptions } from "@/utils/authoptions";
import {
  AuthorizationError,
  NoDataError,
  UnwrapPromise,
  ValidationError,
  withErrorHandling,
  BusinessError,
} from "@/utils/error";
import { canEditMember as _canEditMember } from "@/lib/canEditMember";

async function changeSecondaryEmailForUser(
  secondary_email: string,
  username: string,
): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  if (
    !config.ESPACE_MEMBRE_ADMIN.includes(session.user.id) &&
    session.user.id != username
  ) {
    throw new AuthorizationError();
  }
  const user = await db
    .selectFrom("users")
    .select("secondary_email")
    .where("username", "=", username)
    .executeTakeFirst();
  if (!user) {
    throw new NoDataError("Users not found");
  }
  await db
    .updateTable("users")
    .set({
      secondary_email,
    })
    .where("username", "=", username)
    .execute();
  addEvent({
    action_code: EventCode.MEMBER_SECONDARY_EMAIL_UPDATED,
    created_by_username: session.user.id,
    action_on_username: username,
    action_metadata: {
      value: secondary_email,
      old_value: user.secondary_email || "",
    },
  });
  revalidatePath("/account", "layout");
}

export async function updateCommunicationEmail(
  communication_email: CommunicationEmailCode,
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  const dbUser = await db
    .selectFrom("users")
    .selectAll()
    .where("username", "=", session.user.id)
    .executeTakeFirst();
  if (!dbUser) {
    throw new AuthorizationError();
  }
  let previousCommunicationEmail = dbUser.communication_email;
  let hasBothEmailsSet = dbUser.primary_email && dbUser.secondary_email;
  // @todo send error when emails are not both set
  if (communication_email != previousCommunicationEmail && hasBothEmailsSet) {
    await db
      .updateTable("users")
      .set({
        communication_email,
      })
      .where("username", "=", session.user.id)
      .execute();
    await addEvent({
      action_code: EventCode.MEMBER_COMMUNICATION_EMAIL_UPDATE,
      created_by_username: session.user.id,
      action_on_username: session.user.id,
      action_metadata: {
        value: communication_email,
        old_value: dbUser
          ? (dbUser.communication_email as CommunicationEmailCode)
          : undefined,
      },
    });
    const newEmail =
      communication_email === CommunicationEmailCode.PRIMARY
        ? dbUser.primary_email
        : dbUser.secondary_email;
    const previousEmail =
      previousCommunicationEmail === CommunicationEmailCode.PRIMARY
        ? dbUser.primary_email
        : dbUser.secondary_email;
    await changeContactEmail(previousEmail, {
      email: newEmail as string,
      firstname: capitalizeWords(dbUser.username.split(".")[0]),
      lastname: capitalizeWords(dbUser.username.split(".")[1]),
    });
  }
}

async function changeContactEmail(
  previousEmail,
  contact: Contact,
): Promise<void> {
  if (config.FEATURE_SIB_USE_UPDATE_CONTACT_EMAIL) {
    await updateContactEmail({
      previousEmail,
      newEmail: contact.email,
    });
  } else {
    await addContactsToMailingLists({
      contacts: [contact],
      listTypes: [MAILING_LIST_TYPE.NEWSLETTER],
    });
    await removeContactsFromMailingList({
      emails: [previousEmail],
      listType: MAILING_LIST_TYPE.NEWSLETTER,
    });
  }
}

async function getUserPublicInfo(
  username: string,
): Promise<memberWrapperPublicInfoSchemaType> {
  const user = await userInfos({ username }, false);

  const hasGithubFile = user.userInfos;
  const hasEmailAddress = user.emailInfos || user.emailRedirections.length > 0;
  if (!hasGithubFile && !hasEmailAddress) {
    throw new NoDataError(
      "Il n'y a pas de membre avec ce compte mail. Vous pouvez commencez par l'inviter <a href=\"/onboarding\">en cliquant ici</a>.",
    );
  }
  const dbUser = await db
    .selectFrom("users")
    .selectAll()
    .where("username", "=", username)
    .executeTakeFirst();
  const secondaryEmail: string = dbUser?.secondary_email || "";
  let mattermostUser = dbUser?.primary_email
    ? await getUserByEmail(dbUser.primary_email).catch((e) => null)
    : null;
  let [mattermostUserInTeamAndActive]: MattermostUser[] = dbUser?.primary_email
    ? await searchUsers({
        term: dbUser.primary_email,
        team_id: config.mattermostTeamId,
        allow_inactive: false,
      }).catch((e) => [])
    : [];
  let data: memberWrapperPublicInfoSchemaType = {
    isExpired: user.isExpired,
    hasEmailInfos: !!user.emailInfos,
    isEmailBlocked: user.emailInfos?.isBlocked || false,
    hasSecondaryEmail: !!secondaryEmail,
    mattermostInfo: {
      hasMattermostAccount: !!mattermostUser,
      isInactiveOrNotInTeam: !mattermostUserInTeamAndActive,
    },
    userPublicInfos: memberBaseInfoToMemberPublicInfoModel(user.userInfos),
  };
  return data;
}

/**
 * Updates or creates missions for a member.
 *
 * For existing missions (with uuid): updates the end date and associated startups.
 * Non-admin users can only extend the end date, not shorten it.
 *
 * For new missions (without uuid): creates the mission with all provided data.
 *
 * @param updateMemberMissionsData - Contains memberUuid and an array of missions to update/create
 * @throws AuthorizationError - If user is not authenticated
 * @throws NoDataError - If member or existing mission is not found
 * @throws ValidationError - If non-admin tries to shorten a mission's end date
 */
async function updateMemberMissions(
  updateMemberMissionsData: updateMemberMissionsSchemaType,
): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  const missionData = updateMemberMissionsSchema.parse(
    updateMemberMissionsData,
  );
  const missions = missionData.missions;
  const memberUuid = missionData.memberUuid;
  const dbUser = await getUserBasicInfo({ uuid: memberUuid });
  if (!dbUser) {
    throw new NoDataError(`Impossible de trouver les données sur le membre`);
  }
  const previousInfo = memberBaseInfoToModel(dbUser);
  const canEditMember = await _canEditMember({
    memberUuid: previousInfo.uuid,
    sessionUser: session.user,
  });

  // todo check that it is authorized
  await db.transaction().execute(async (trx) => {
    for (const mission of missions) {
      if (mission.uuid) {
        const missionPreviousData = previousInfo?.missions.find(
          (m) => m.uuid === mission.uuid,
        );
        if (!missionPreviousData) {
          throw new NoDataError("La mission devrait déjà exister");
        }
        if (
          // n'autorise que les admins ou membres de l'incubateur à mettre une date inférieure
          !canEditMember &&
          (!mission.end ||
            !missionPreviousData.end ||
            mission.end < missionPreviousData.end)
        ) {
          throw new ValidationError(
            "Error: La nouvelle date de mission doit être supérieure à la précédente.",
          );
        }
        const { uuid, end } = mission;
        await updateMission(
          uuid,
          {
            end,
            user_id: memberUuid,
            startups: mission.startups,
          },
          trx,
        );
      } else {
        await createMission(
          {
            ...mission,
            user_id: memberUuid,
            startups: mission.startups,
          },
          trx,
        );
      }
    }
  });
  revalidatePath("/community/[id]", "layout");
}

export async function manageSecondaryEmailForUser({
  username,
  secondaryEmail,
}: {
  username: string;
  secondaryEmail: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  const isCurrentUser = session.user.id === username;

  const user = await userInfos({ username }, isCurrentUser);
  if (!isCurrentUser && !user.isExpired) {
    throw new BusinessError(
      `Le compte "${username}" n'est pas expiré, vous ne pouvez pas supprimer ce compte.`,
    );
  }

  if (
    user.authorizations.canChangeEmails ||
    config.ESPACE_MEMBRE_ADMIN.includes(session.user.id)
  ) {
    const user = await db
      .selectFrom("users")
      .select("secondary_email")
      .where("username", "=", username)
      .executeTakeFirst();

    if (!user) {
      throw new BusinessError("Users not found");
    }

    await db
      .updateTable("users")
      .set({
        secondary_email: secondaryEmail,
      })
      .where("username", "=", username)
      .execute();

    await addEvent({
      action_code: EventCode.MEMBER_SECONDARY_EMAIL_UPDATED,
      created_by_username: session.user.id,
      action_on_username: username,
      action_metadata: {
        value: secondaryEmail,
        old_value: user.secondary_email || "",
      },
    });

    console.log(`${session.user.id} a mis à jour son adresse mail secondaire.`);
  }
}

export const safeUpdateMemberMissions = withErrorHandling(updateMemberMissions);
export const safeGetUserPublicInfo = withErrorHandling<
  UnwrapPromise<ReturnType<typeof getUserPublicInfo>>,
  Parameters<typeof getUserPublicInfo>
>(getUserPublicInfo);
export const safeChangeSecondaryEmailForUser = withErrorHandling<
  UnwrapPromise<ReturnType<typeof changeSecondaryEmailForUser>>,
  Parameters<typeof changeSecondaryEmailForUser>
>(changeSecondaryEmailForUser);
export const safeUpdateCommunicationEmail = withErrorHandling<
  UnwrapPromise<ReturnType<typeof updateCommunicationEmail>>,
  Parameters<typeof updateCommunicationEmail>
>(updateCommunicationEmail);
export const safeManageSecondaryEmailForUser = withErrorHandling<
  UnwrapPromise<ReturnType<typeof manageSecondaryEmailForUser>>,
  Parameters<typeof manageSecondaryEmailForUser>
>(manageSecondaryEmailForUser);

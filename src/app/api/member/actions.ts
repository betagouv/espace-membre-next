"use server";

import { getServerSession } from "next-auth/next";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { createMission, updateMission } from "@/lib/kysely/queries/missions";
import { getUserBasicInfo, getUserInfos } from "@/lib/kysely/queries/users";
import { getUserByEmail, MattermostUser, searchUsers } from "@/lib/mattermost";
import { EventCode } from "@/models/actionEvent";
import { updateMemberMissionsSchemaType } from "@/models/actions/member";
import { UpdateOvhResponder } from "@/models/actions/ovh";
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

export async function changeSecondaryEmailForUser(
    secondary_email: string,
    username: string
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    if (
        !config.ESPACE_MEMBRE_ADMIN.includes(session.user.id) &&
        session.user.id != username
    ) {
        throw new Error(`You are not allowed to execute this function`);
    }
    const user = await db
        .selectFrom("users")
        .select("secondary_email")
        .where("username", "=", username)
        .executeTakeFirst();
    if (!user) {
        throw new Error("Users not found");
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
}

export async function updateCommunicationEmail(
    communication_email: CommunicationEmailCode
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    const dbUser = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", session.user.id)
        .executeTakeFirst();
    if (!dbUser) {
        throw new Error(`You don't have the right to access this function`);
    }
    let previousCommunicationEmail = dbUser.communication_email;
    let hasBothEmailsSet = dbUser.primary_email && dbUser.secondary_email;
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

async function changeContactEmail(previousEmail, contact: Contact) {
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

export async function setEmailResponder({
    content,
    from,
    to,
}: UpdateOvhResponder) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    if (!to || new Date(to).getTime() < new Date(from).getTime()) {
        throw new Error(
            "nouvelle date de fin : la date doit être supérieure à la date de début"
        );
    }

    const responder = await betagouv.getResponder(session.user.id);
    if (!responder) {
        await betagouv.setResponder(session.user.id, {
            from,
            to,
            content,
        });
        await addEvent({
            action_code: EventCode.MEMBER_RESPONDER_CREATED,
            created_by_username: session.user.id,
            action_on_username: session.user.id,
            action_metadata: {
                value: content,
            },
        });
    } else {
        await betagouv.updateResponder(session.user.id, {
            from,
            to,
            content,
        });
        await addEvent({
            action_code: EventCode.MEMBER_RESPONDER_UPDATED,
            created_by_username: session.user.id,
            action_on_username: session.user.id,
            action_metadata: {
                value: content,
                old_value: responder.content,
            },
        });
    }
    return true;
}

export async function deleteResponder() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    await betagouv.deleteResponder(session.user.id);
    addEvent({
        action_code: EventCode.MEMBER_RESPONDER_DELETED,
        created_by_username: session.user.id,
        action_on_username: session.user.id,
    });
}

export async function getUserPublicInfo(
    username: string
): Promise<memberWrapperPublicInfoSchemaType> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    try {
        const user = await userInfos({ username }, false);

        const hasGithubFile = user.userInfos;
        const hasEmailAddress =
            user.emailInfos || user.emailRedirections.length > 0;
        if (!hasGithubFile && !hasEmailAddress) {
            throw new Error(
                'Il n\'y a pas de membres avec ce compte mail. Vous pouvez commencez par créer une fiche sur Github pour la personne <a href="/onboarding">en cliquant ici</a>.'
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
        let [mattermostUserInTeamAndActive]: MattermostUser[] =
            dbUser?.primary_email
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
            // canCreateEmail: user.authorizations.canCreateEmail || false,
            // emailInfos: req.auth?.id ? user.emailInfos : undefined,
            mattermostInfo: {
                hasMattermostAccount: !!mattermostUser,
                isInactiveOrNotInTeam: !mattermostUserInTeamAndActive,
            },
            userPublicInfos: memberBaseInfoToMemberPublicInfoModel(
                user.userInfos
            ),
        };
        return data;
    } catch (err) {
        console.error(err);
        throw new Error(
            "Impossible de récupérer les informations du membre de la communauté."
        );
    }
}

export async function updateMemberMissions(
    updateMemberMissionsData: updateMemberMissionsSchemaType
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    const missions = updateMemberMissionsData.missions;
    const memberUuid = updateMemberMissionsData.memberUuid;
    const dbUser = await getUserBasicInfo({ uuid: memberUuid });
    if (!dbUser) {
        throw new Error(`Impossible de trouver les données sur le membre`);
    }
    const previousInfo = memberBaseInfoToModel(dbUser);

    // todo check that it is authorized
    await db.transaction().execute(async (trx) => {
        for (const mission of missions) {
            // Now, use the same transaction to link to an organization
            if (mission.uuid) {
                const missionPreviousData = previousInfo?.missions.find(
                    (m) => m.uuid === mission.uuid
                );
                if (!missionPreviousData) {
                    throw new Error("La mission devrait déjà exister");
                }
                if (
                    !mission.end ||
                    !missionPreviousData.end ||
                    mission.end < missionPreviousData.end
                ) {
                    throw new Error(
                        "La nouvelle date de mission doit être supérieur à la précédente."
                    );
                }
                const { uuid, end } = mission;
                updateMission(
                    uuid,
                    {
                        end,
                        user_id: memberUuid,
                    },
                    trx
                );
            } else {
                await createMission(
                    {
                        ...mission,
                        user_id: memberUuid,
                    },
                    trx
                );
            }
        }
    });
}

"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { createMission, updateMission } from "@/lib/kysely/queries/missions";
import { getUserBasicInfo, getUserInfos } from "@/lib/kysely/queries/users";
import { getUserByEmail, MattermostUser, searchUsers } from "@/lib/mattermost";
import * as mattermost from "@/lib/mattermost";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { updateMemberMissionsSchemaType } from "@/models/actions/member";
import { UpdateOvhResponder } from "@/models/actions/ovh";
import {
    memberBaseInfoToMemberPublicInfoModel,
    memberBaseInfoToModel,
} from "@/models/mapper";
import {
    CommunicationEmailCode,
    EmailStatusCode,
    memberWrapperPublicInfoSchemaType,
} from "@/models/member";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import { isSessionUserIncubatorTeamAdminForUser } from "@/server/config/admin.config";
import {
    updateContactEmail,
    addContactsToMailingLists,
    removeContactsFromMailingList,
} from "@/server/config/email.config";
import {
    capitalizeWords,
    isPublicServiceEmail,
    isAdminEmail,
    userInfos,
    buildBetaEmail,
} from "@/server/controllers/utils";
import { Contact, MAILING_LIST_TYPE } from "@/server/modules/email";
import { authOptions } from "@/utils/authoptions";
import {
    AuthorizationError,
    NoDataError,
    UnwrapPromise,
    ValidationError,
    OVHError,
    withErrorHandling,
    AdminEmailNotAllowedError,
} from "@/utils/error";

async function changeSecondaryEmailForUser(
    secondary_email: string,
    username: string
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

async function updateCommunicationEmail(
    communication_email: CommunicationEmailCode
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
    contact: Contact
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

async function setEmailResponder({
    content,
    from,
    to,
}: UpdateOvhResponder): Promise<void> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    if (!to || new Date(to).getTime() < new Date(from).getTime()) {
        throw new ValidationError(
            "nouvelle date de fin : la date doit être supérieure à la date de début"
        );
    }
    const responder = await betagouv.getResponder(session.user.id);
    if (!responder) {
        try {
            await betagouv.setResponder(session.user.id, {
                from,
                to,
                content,
            });
        } catch (e: any) {
            throw new OVHError(e?.message);
        }
        await addEvent({
            action_code: EventCode.MEMBER_RESPONDER_CREATED,
            created_by_username: session.user.id,
            action_on_username: session.user.id,
            action_metadata: {
                value: content,
            },
        });
    } else {
        try {
            await betagouv.updateResponder(session.user.id, {
                from,
                to,
                content,
            });
        } catch (e: any) {
            throw new OVHError(e?.message);
        }

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
}

async function deleteResponder(): Promise<void> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }

    await betagouv.deleteResponder(session.user.id);

    addEvent({
        action_code: EventCode.MEMBER_RESPONDER_DELETED,
        created_by_username: session.user.id,
        action_on_username: session.user.id,
    });
}

async function getUserPublicInfo(
    username: string
): Promise<memberWrapperPublicInfoSchemaType> {
    const user = await userInfos({ username }, false);

    const hasGithubFile = user.userInfos;
    const hasEmailAddress =
        user.emailInfos || user.emailRedirections.length > 0;
    if (!hasGithubFile && !hasEmailAddress) {
        throw new NoDataError(
            "Il n'y a pas de membre avec ce compte mail. Vous pouvez commencez par l'inviter <a href=\"/onboarding\">en cliquant ici</a>."
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
        userPublicInfos: memberBaseInfoToMemberPublicInfoModel(user.userInfos),
    };
    return data;
}

async function updateMemberMissions(
    updateMemberMissionsData: updateMemberMissionsSchemaType
): Promise<void> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    const missions = updateMemberMissionsData.missions;
    const memberUuid = updateMemberMissionsData.memberUuid;
    const dbUser = await getUserBasicInfo({ uuid: memberUuid });
    if (!dbUser) {
        throw new NoDataError(
            `Impossible de trouver les données sur le membre`
        );
    }
    const previousInfo = memberBaseInfoToModel(dbUser);
    const sessionUserIsFromIncubatorTeam =
        !!session.user.isAdmin ||
        (await isSessionUserIncubatorTeamAdminForUser({
            user: previousInfo,
            sessionUserUuid: session.user.uuid,
        }));

    // todo check that it is authorized
    await db.transaction().execute(async (trx) => {
        for (const mission of missions) {
            if (mission.uuid) {
                const missionPreviousData = previousInfo?.missions.find(
                    (m) => m.uuid === mission.uuid
                );
                if (!missionPreviousData) {
                    throw new NoDataError("La mission devrait déjà exister");
                }
                if (
                    !sessionUserIsFromIncubatorTeam &&
                    (!mission.end ||
                        !missionPreviousData.end ||
                        mission.end < missionPreviousData.end)
                ) {
                    throw new ValidationError(
                        "Error: La nouvelle date de mission doit être supérieur à la précédente."
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
                    trx
                );
            } else {
                await createMission(
                    {
                        ...mission,
                        user_id: memberUuid,
                        startups: mission.startups,
                    },
                    trx
                );
            }
        }
    });
    revalidatePath("/community/[id]", "layout");
}

export async function managePrimaryEmailForUser({
    username,
    primaryEmail,
}: {
    username: string;
    primaryEmail: string;
}): Promise<void> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    const isCurrentUser = session?.user.id === username;
    const user = await userInfos({ username }, isCurrentUser);
    if (!user.authorizations.canChangeEmails) {
        throw new Error(
            `L'utilisateur n'est pas autorisé à changer l'email primaire`
        );
    }
    const primaryEmailIsPublicServiceEmail = await isPublicServiceEmail(
        primaryEmail
    );
    if (!primaryEmailIsPublicServiceEmail) {
        throw new Error(
            `L'email renseigné n'est pas un email de service public`
        );
    }
    if (isAdminEmail(primaryEmail)) {
        throw new AdminEmailNotAllowedError();
    }

    if (user.userInfos.primary_email?.includes(config.domain)) {
        await betagouv.createRedirection(
            user.userInfos.primary_email,
            primaryEmail,
            false
        );
        try {
            await betagouv.deleteEmail(
                user.userInfos.primary_email.split("@")[0]
            );
        } catch (e) {
            console.log(e, "Email is possibly already deleted");
        }
    } else {
        try {
            await mattermost.getUserByEmail(primaryEmail);
        } catch {
            throw new Error(
                `L'email n'existe pas dans mattermost, pour utiliser cette adresse comme adresse principale ton compte mattermost doit aussi utiliser cette adresse.`
            );
        }
    }
    await db
        .updateTable("users")
        .where("username", "=", username)
        .set({
            primary_email: primaryEmail,
            username,
        })
        .execute();

    await addEvent({
        action_code: EventCode.MEMBER_PRIMARY_EMAIL_UPDATED,
        created_by_username: session.user.id,
        action_on_username: username,
        action_metadata: {
            value: primaryEmail,
            old_value: user
                ? user.userInfos.primary_email || undefined
                : undefined,
        },
    });

    console.log(`${session?.user.id} a mis à jour son adresse mail primaire.`);
    revalidatePath("/community/[id]", "layout");
    return;
}

export async function deleteEmailForUser({ username }: { username: string }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    const isCurrentUser = session.user.id === username;

    try {
        const user = await userInfos({ username }, isCurrentUser);
        if (!isCurrentUser && !user.isExpired) {
            throw new Error(
                `Le compte "${username}" n'est pas expiré, vous ne pouvez pas supprimer ce compte.`
            );
        }

        await betagouv.sendInfoToChat(
            `Suppression de compte de ${username} (à la demande de ${session.user.id})`
        );
        await addEvent({
            action_code: EventCode.MEMBER_EMAIL_DELETED,
            created_by_username: session.user.id,
            action_on_username: username,
        });
        if (user.emailRedirections && user.emailRedirections.length > 0) {
            await betagouv.requestRedirections(
                "DELETE",
                user.emailRedirections.map((x) => x.id)
            );
            console.log(
                `Suppression des redirections de l'email de ${username} (à la demande de ${session.user.id})`
            );
        }

        await betagouv.createRedirection(
            buildBetaEmail(username),
            config.leavesEmail,
            false
        );
        await db
            .updateTable("users")
            .set({
                secondary_email: null,
                primary_email: null,
                primary_email_status: EmailStatusCode.EMAIL_UNSET,
            })
            .where("username", "=", username)
            .execute();
        console.log(
            `Redirection des emails de ${username} vers ${config.leavesEmail} (à la demande de ${session.user.id})`
        );
        let redirectUrl;
        if (isCurrentUser) {
            cookies().set("next-auth.session-token", "", {
                maxAge: -1,
                path: "/",
            });
            // Optionally, clear other cookies related to authentication
            cookies().set("__Secure-next-auth.session-token", "", {
                maxAge: -1,
                path: "/",
            });
        }
    } catch (err) {
        console.error(err);
    }
}

export const safeUpdateMemberMissions = withErrorHandling(updateMemberMissions);
export const safeGetUserPublicInfo = withErrorHandling<
    UnwrapPromise<ReturnType<typeof getUserPublicInfo>>,
    Parameters<typeof getUserPublicInfo>
>(getUserPublicInfo);
export const safeDeleteResponder = withErrorHandling<
    UnwrapPromise<ReturnType<typeof deleteResponder>>,
    Parameters<typeof deleteResponder>
>(deleteResponder);
export const safeSetEmailResponder = withErrorHandling<
    UnwrapPromise<ReturnType<typeof setEmailResponder>>,
    Parameters<typeof setEmailResponder>
>(setEmailResponder);
export const safeChangeSecondaryEmailForUser = withErrorHandling<
    UnwrapPromise<ReturnType<typeof changeSecondaryEmailForUser>>,
    Parameters<typeof changeSecondaryEmailForUser>
>(changeSecondaryEmailForUser);
export const safeUpdateCommunicationEmail = withErrorHandling<
    UnwrapPromise<ReturnType<typeof updateCommunicationEmail>>,
    Parameters<typeof updateCommunicationEmail>
>(updateCommunicationEmail);
export const safeManagePrimaryEmailForUser = withErrorHandling<
    UnwrapPromise<ReturnType<typeof managePrimaryEmailForUser>>,
    Parameters<typeof managePrimaryEmailForUser>
>(managePrimaryEmailForUser);
export const safeDeleteEmailForUser = withErrorHandling<
    UnwrapPromise<ReturnType<typeof deleteEmailForUser>>,
    Parameters<typeof deleteEmailForUser>
>(deleteEmailForUser);

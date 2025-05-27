import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { MattermostUser } from "@/lib/mattermost";
import * as mattermost from "@/lib/mattermost";
import { memberBaseInfoToModel } from "@/models/mapper";
import { EmailStatusCode, memberBaseInfoSchemaType } from "@/models/member";
import config from "@/server/config";
import betagouv from "@betagouv";
import * as utils from "@controllers/utils";
import { sendInfoToChat } from "@infra/chat";

const filterActiveUser = (user) => {
    return (
        user.primary_email &&
        [
            EmailStatusCode.EMAIL_ACTIVE,
            EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING,
        ].includes(user.primary_email_status)
    );
};

const getUnallowedEmails = async (teamId) => {
    const allMattermostUsers: MattermostUser[] =
        await mattermost.getUserWithParams({
            in_team: teamId,
            active: true,
        });
    const usersWithUnallowedEmails = allMattermostUsers.filter((user) => {
        const domain = user.email.split("@")[1];
        return !config.MATTERMOST_ALLOWED_DOMAINS.split(",").includes(domain);
    });
    return usersWithUnallowedEmails;
};

export const sendMessageToMattermostUsersWithUnallowedEmails = async (
    teamId: string,
): Promise<void> => {
    const usersWithUnallowedEmails = await getUnallowedEmails(teamId);
    for (const user of usersWithUnallowedEmails) {
        await sendInfoToChat({
            text: `Bonjour, cet espace mattermost (espace Communauté) n'est autorisé que pour les personnes ayant une adresse d'agent public.
  Généralement une adresse @beta.gouv.fr. Tu as probablement changé ton adresse sans le savoir. 
  Nous t'invitons à utiliser ton adresse d'agent public, sinon ton compte risque d'être désactivé la semaine prochaine.`,
            username: user.username,
            channel: "secretariat",
        });
    }
};

export const deactivateMattermostUsersWithUnallowedEmails = async (
    teamId: string,
): Promise<void> => {
    const usersWithUnallowedEmails = await getUnallowedEmails(teamId);
    for (const user of usersWithUnallowedEmails) {
        await mattermost.deactiveUsers(user.id);
    }
};

export const getActiveGithubUsersUnregisteredOnMattermost = async (): Promise<
    memberBaseInfoSchemaType[]
> => {
    const allMattermostUsers: MattermostUser[] =
        await mattermost.getUserWithParams();
    const githubUsers = (await getAllUsersInfo()).map((user) =>
        memberBaseInfoToModel(user),
    );
    const activeGithubUsers = githubUsers.filter(
        (x) => !utils.checkUserIsExpired(x),
    );
    const concernedUsers = activeGithubUsers
        // .map((user: Member) => {
        //     const dbUser = findDBUser(dbUsers, user);
        //     return mergedMemberAndDBUser(user, dbUser as DBUser);
        // })
        .filter(filterActiveUser);
    const allMattermostUsersEmails = allMattermostUsers.map(
        (mattermostUser) => mattermostUser.email,
    );
    return concernedUsers.filter(
        (user) =>
            !allMattermostUsersEmails.includes(user.primary_email as string),
    );
};

export const getMattermostUsersActiveGithubUsersNotInTeam = async (
    teamId: string,
): Promise<MattermostUser[]> => {
    const allMattermostUsers: MattermostUser[] =
        await mattermost.getUserWithParams({ not_in_team: teamId });
    const githubUsers = (await getAllUsersInfo()).map((user) =>
        memberBaseInfoToModel(user),
    );
    const activeGithubUsers = githubUsers.filter(
        (x) => !utils.checkUserIsExpired(x),
    );
    const concernedUsers = activeGithubUsers
        // .map((user) => {
        //     const dbUser = findDBUser(dbUsers, user);
        //     return mergedMemberAndDBUser(user, dbUser as DBUser);
        // })
        .filter(filterActiveUser);
    const concernedUsersEmails = concernedUsers.map(
        (user) => user.primary_email,
    );
    return allMattermostUsers.filter((user) =>
        concernedUsersEmails.includes(user.email),
    );
};

export * from "./createUsersByEmail";
export * from "./inviteUserToTeamByEmail";
export * from "./moveUsersToAlumniTeam";
export * from "./reactivateUsers";
export * from "./removeUsersFromCommunityTeam";
export * from "./removeBetaAndParnersUsersFromCommunityTeam";

import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { MattermostUser } from "@/lib/mattermost";
import * as mattermost from "@/lib/mattermost";
import { memberBaseInfoToModel } from "@/models/mapper";
import { EmailStatusCode, memberBaseInfoSchemaType } from "@/models/member";
import * as utils from "@controllers/utils";

const filterActiveUser = (user) => {
  const fiveMinutesInMs: number = 5 * 1000 * 60;
  const nowLessFiveMinutes: Date = new Date(Date.now() - fiveMinutesInMs);
  return (
    user.primary_email &&
    [
      EmailStatusCode.EMAIL_ACTIVE,
      EmailStatusCode.EMAIL_REDIRECTION_ACTIVE,
      EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING,
    ].includes(user.primary_email_status) &&
    user.primary_email_status_updated_at < nowLessFiveMinutes
  );
};

export const getActiveUsersUnregisteredOnMattermost = async (): Promise<
  memberBaseInfoSchemaType[]
> => {
  const allMattermostUsers: MattermostUser[] =
    await mattermost.getUserWithParams();
  const users = (await getAllUsersInfo()).map((user) =>
    memberBaseInfoToModel(user),
  );
  const concernedUsers = users
    .filter((x) => !utils.checkUserIsExpired(x))
    .filter(filterActiveUser)
    .filter((user) => user.primary_email);
  // const concernedUsers = activeGithubUsers
  //     .map((user) => {
  //         const dbUser = findDBUser(dbUsers, user);
  //         return mergedMemberAndDBUser(user, dbUser as DBUser);
  //     })
  //     .filter(filterActiveUser) as MemberWithPrimaryEmailInfo[];
  const allMattermostUsersEmails = allMattermostUsers.map(
    (mattermostUser) => mattermostUser.email,
  );
  return concernedUsers.filter(
    (user) => !allMattermostUsersEmails.includes(user.primary_email as string),
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
  console.log(`Active github users ${activeGithubUsers.length}`);
  const concernedUsers = activeGithubUsers
    // .map((user) => {
    //     const dbUser = findDBUser(dbUsers, user);
    //     return mergedMemberAndDBUser(user, dbUser as DBUser);
    // })
    .filter(filterActiveUser);
  console.log(`Active github users ${activeGithubUsers.length}`);
  const concernedUsersEmails = concernedUsers.map((user) => user.primary_email);
  return allMattermostUsers.filter((user) =>
    concernedUsersEmails.includes(user.email),
  );
};

export const getMattermostUsersActiveGithubUsersInTeam = async (
  teamId: string,
): Promise<MattermostUser[]> => {
  const allMattermostUsers: MattermostUser[] =
    await mattermost.getUserWithParams({ in_team: teamId });
  const githubUsers = (await getAllUsersInfo()).map((user) =>
    memberBaseInfoToModel(user),
  );
  const activeGithubUsers = githubUsers.filter(
    (x) => !utils.checkUserIsExpired(x),
  );
  console.log(`Active github users ${activeGithubUsers.length}`);
  const concernedUsers = activeGithubUsers
    // .map((user: DBUserPublic) => {
    //     const dbUser = findDBUser(dbUsers, user);
    //     return mergedMemberAndDBUser(user, dbUser as DBUser);
    // })
    .filter(filterActiveUser);
  const concernedUsersEmails = concernedUsers.map((user) => user.primary_email);
  return allMattermostUsers.filter((user) =>
    concernedUsersEmails.includes(user.email),
  );
};

export * from "./createUsersByEmail";
export * from "./inviteUserToTeamByEmail";
export * from "./moveUsersToAlumniTeam";
export * from "./reactivateUsers";
export * from "./removeUsersFromCommunityTeam";
export * from "./addUsersNotInCommunityToCommunityTeam";
export * from "./syncMattermostUserWithMattermostMemberInfosTable";
export * from "./syncMattermostUserStatusWithMattermostMemberInfosTable";
export * from "./sendGroupeDeSoutienReminder";

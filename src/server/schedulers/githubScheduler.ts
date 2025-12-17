import BetaGouv from "../betagouv";
import * as github from "@/lib/github";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import config from "@/server/config";
import { checkUserIsExpired } from "@controllers/utils";
import pAll from "p-all";

// get users that are member (got a github card) and that have github account that is not in the team
const getGithubUsersNotInOrganization = async (org) => {
  const allGithubOrganizationMembers =
    await github.getAllOrganizationMembers(org);
  const users = (await getAllUsersInfo()).map((user) =>
    memberBaseInfoToModel(user),
  );

  const activeGithubUsers = users.filter((x) => {
    const stillActive = !checkUserIsExpired(x);
    return stillActive && x.github;
  });
  const allGithubOrganizationMembersUsername = allGithubOrganizationMembers.map(
    (githubOrganizationMember) => githubOrganizationMember.login.toLowerCase(),
  );

  const pendingInvitations = await github.getAllPendingInvitations(
    config.githubOrganizationName,
  );
  const pendingInvitationsUsernames = pendingInvitations.map((r) =>
    r.login.toLowerCase(),
  );
  const githubUserNotOnOrganization = activeGithubUsers.filter((user) => {
    const githubUsername = user?.github?.toLowerCase();
    return (
      !allGithubOrganizationMembersUsername.includes(githubUsername) &&
      !pendingInvitationsUsernames.includes(githubUsername)
    );
  });

  return githubUserNotOnOrganization;
};

// get users that are member (got a github card) and that have github account that is not in the team
const getExpiredGithubUsersInOrganization = async (
  org,
  numberOfExpirationDays = 0,
) => {
  const allGithubOrganizationMembers =
    await github.getAllOrganizationMembers(org);
  const users = (await getAllUsersInfo()).map((user) =>
    memberBaseInfoToModel(user),
  );

  const expiredGithubUsers = users.filter((x) => {
    const isExpired = checkUserIsExpired(x, numberOfExpirationDays);
    return isExpired && x.github;
  });
  const allGithubOrganizationMembersUsername = allGithubOrganizationMembers.map(
    (githubOrganizationMember) => githubOrganizationMember.login.toLowerCase(),
  );

  const githubExpiredUsers = expiredGithubUsers.filter((user) => {
    const githubUsername = user?.github?.toLowerCase();
    return allGithubOrganizationMembersUsername.includes(githubUsername);
  });

  return githubExpiredUsers;
};

const addGithubUserToOrganization = async () => {
  console.log("Launch add github users to organization");

  const githubUsersNotOnOrganization = await getGithubUsersNotInOrganization(
    config.githubOrganizationName,
  );
  await Promise.all(
    githubUsersNotOnOrganization.map(async (member) => {
      try {
        await github.inviteUserByUsernameToOrganization(
          member.github,
          config.githubOrganizationName,
        );
        await github.addUserToTeam(
          member.github,
          config.githubOrganizationName,
          config.githubBetagouvTeam,
        );
        console.log(`github: Add user ${member.github} to organization`);
      } catch (err) {
        console.error(
          `github: Cannot add user ${member.github} to organization ${config.githubOrganizationName}. Error : ${err}`,
        );
      }
    }),
  );
};

export { addGithubUserToOrganization };

const removeGithubUserFromOrganization = async () => {
  console.log("Launch remove github users from organization");

  const expiredUsers = await getExpiredGithubUsersInOrganization(
    config.githubOrganizationName,
    1,
  );
  await pAll(
    expiredUsers.map((member) => async () => {
      try {
        await github.removeUserByUsernameFromOrganization(
          member.github,
          config.githubOrganizationName,
        );
        console.log(`github: Remove user ${member.github} from organization`);
      } catch (err) {
        console.error(
          `github: Cannot remove user ${member.github} from organization ${config.githubOrganizationName}. Error : ${err}`,
        );
      }
    }),
    { concurrency: 1 },
  );
};

export { removeGithubUserFromOrganization };

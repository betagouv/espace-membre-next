import * as github from "@/lib/github";
import { getAllUsersInfo, getUserInfos } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import config from "@/server/config";

// get users that are members of organization but don't have matching github card
const getUnknownGithubUsersInOrganization = async (org) => {
  const allGithubOrganizationMembers =
    await github.getAllOrganizationMembers(org);
  const users = (await getAllUsersInfo()).map((user) =>
    memberBaseInfoToModel(user),
  );

  const activeGithubUsers = users
    .filter((x) => x.github)
    .map((x) => (x.github as string).toLowerCase());

  return allGithubOrganizationMembers.filter((user) => {
    const githubUsername = user.login.toLowerCase();
    return !activeGithubUsers.includes(githubUsername);
  });
};

const removeUnknownGithubUserFromOrganization = async () => {
  console.log("Launch remove unknown github users from organization");

  const unknownUsersInOrganization = await getUnknownGithubUsersInOrganization(
    config.githubOrganizationName,
  );
  console.log("List unknown users");
  if (process.env.featureRemoveUnknownUsers) {
    await Promise.all(
      unknownUsersInOrganization.map(async (member) => {
        try {
          await github.removeUserByUsernameFromOrganization(
            member.login,
            config.githubOrganizationName,
          );
          console.log(`Remove user ${member.github} from organization`);
        } catch (err) {
          console.error(
            `Cannot remove user ${member.github} from organization ${config.githubOrganizationName}. Error : ${err}`,
          );
        }
      }),
    );
  }
};
removeUnknownGithubUserFromOrganization();

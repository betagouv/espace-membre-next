import { Octokit } from "@octokit/rest";

import config from "@/server/config";

/**
 * Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.
 * @see https://github.com/shinnn/github-username-regex
 * @see https://github.com/join
 */
function isValidGithubUserName(value) {
    return !value || /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(value);
}

export { isValidGithubUserName };

const createOctokitAuth = () => {
    if (!config.githubOrgAdminToken) {
        const errorMessage =
            "Unable to launch github request without env var githubOrgAdminToken";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
    return new Octokit({ auth: config.githubOrgAdminToken });
};

const getGithubMembersOfOrganization = (org, i) => {
    const octokit = createOctokitAuth();
    return octokit
        .request("GET /orgs/{org}/members", {
            org,
            per_page: 100,
            page: i,
        })
        .then((resp) => resp.data);
};

export { getGithubMembersOfOrganization };

const getPendingInvitations = (org, i) => {
    const octokit = createOctokitAuth();
    return octokit
        .request("GET /orgs/{org}/invitations", {
            org,
            per_page: 100,
            page: i,
        })
        .then((resp) => resp.data);
};

export async function getAllPendingInvitations(org, i = 0) {
    const githubUsers = await getPendingInvitations(org, i);
    if (!githubUsers.length) {
        return [];
    }
    const nextPageGithubUsers = await exports.getAllPendingInvitations(
        org,
        i + 1
    );
    return [...githubUsers, ...nextPageGithubUsers];
}

export async function getAllOrganizationMembers(org, i = 0) {
    const githubUsers = await getGithubMembersOfOrganization(org, i);
    if (!githubUsers.length) {
        return [];
    }
    const nextPageGithubUsers = await exports.getAllOrganizationMembers(
        org,
        i + 1
    );
    return [...githubUsers, ...nextPageGithubUsers];
}

export function inviteUserByUsernameToOrganization(username, org) {
    const octokit = createOctokitAuth();
    return octokit.request("PUT /orgs/{org}/memberships/{username}", {
        org,
        username,
    });
}

export function addUserToTeam(username, org, team_slug) {
    const octokit = createOctokitAuth();
    return octokit.request(
        "PUT /orgs/{org}/teams/{team_slug}/memberships/{username}",
        {
            org,
            team_slug,
            username,
        }
    );
}

export function removeUserByUsernameFromOrganization(username, org) {
    const octokit = createOctokitAuth();
    return octokit.request("DELETE /orgs/{org}/memberships/{username}", {
        org,
        username,
    });
}

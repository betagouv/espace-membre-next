import { request } from "@octokit/request";
import { Octokit } from "@octokit/rest";
import fm from "front-matter";
import { ZodError, ZodSchema, z } from "zod";

import config from "@/server/config";

function getURL(objectID) {
    return `https://api.github.com/repos/betagouv/beta.gouv.fr/${objectID}`;
}

const requestWithAuth = request.defaults({
    headers: {
        authorization: `token ${config.githubToken}`,
    },
});

function extractEndDates(item) {
    const periods = ["before", "after"];
    return periods.reduce((result, p) => {
        const dates = item[p].attributes.missions.map((m) => m.end);
        dates.sort((a, b) => a - b);
        result[p] = dates[dates.length - 1];

        return result;
    }, {});
}

export { extractEndDates };

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

export function getPullRequestFiles(
    owner: string,
    repo: string,
    pull_number: number
) {
    const octokit = createOctokitAuth();
    return octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number,
    });
}

export async function getPullRequest({ head }: { head: string }) {
    const url = `https://api.github.com/repos/${config.githubRepository}/pulls?state=open&head=${head}&per_page=1`;
    const pulls = await requestWithAuth(url);
    const pull = (pulls.data.length && pulls.data[0]) || undefined;
    return pull.head.label === head && pull;
}

export function getPullRequests(
    owner: string,
    repo: string,
    state: "all" | "open" | "closed"
) {
    const octokit = createOctokitAuth();
    return octokit.rest.pulls.list({
        owner,
        repo,
        state,
    });
}

export function getGithubMasterSha() {
    const url = `https://api.github.com/repos/${config.githubRepository}/git/ref/heads/master`;
    return requestWithAuth(url);
}

export function createGithubBranch(sha, branch) {
    const url = `https://api.github.com/repos/${config.githubFork}/git/refs`;
    const ref = `refs/heads/${branch}`;
    return requestWithAuth(`POST ${url}`, { sha, ref });
}

export function getGithubBranch(branch) {
    const url = `https://api.github.com/repos/${config.githubFork}/branches/${branch}`;
    return requestWithAuth(`GET ${url}`);
}

export function deleteGithubBranch(branch) {
    const url = `https://api.github.com/repos/${config.githubFork}/git/refs/heads/${branch}`;
    return requestWithAuth(`DELETE ${url}`);
}

export function getLastCommitFromFile(path, branch) {
    const url = `https://api.github.com/repos/${config.githubRepository}/commits?path=${path}&page=1&per_page=1`;
    return requestWithAuth(`GET ${url}`, { branch });
}

export function getGithubFile(path, branch) {
    const url = `https://api.github.com/repos/${config.githubFork}/contents/${path}?ref=${branch}`;

    return requestWithAuth(`GET ${url}`, { branch });
}

export function createGithubFile(path, branch, content, sha = undefined) {
    const url = `https://api.github.com/repos/${config.githubFork}/contents/${path}`;
    const message = `${
        sha ? "Mise à jour" : "Création"
    } de fichier ${path} sur la branche ${branch}`;
    let base64EncodedContent = content;
    let regex = new RegExp(/[^\s]+(.*?).(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/);
    if (!regex.test(path)) {
        base64EncodedContent = Buffer.from(content, "utf-8").toString("base64");
    }

    return requestWithAuth(`PUT ${url}`, {
        branch,
        sha,
        message,
        content: base64EncodedContent,
    });
}

export function makeGithubPullRequest(branch: string, title: string) {
    const url = `https://api.github.com/repos/${config.githubRepository}/pulls`;
    const head = `${config.githubFork.split("/")[0]}:${branch}`;
    const base = "master";

    return requestWithAuth(`POST ${url}`, {
        title,
        head,
        base,
        maintainer_can_modify: true,
    });
}

const fetchGithubOptions = {
    headers: {
        Authorization: `token ${config.githubToken}`,
    },
};

export type GithubAPIPullRequest = {
    html_url: string;
    number: number;
    created_at: string;
    udpated_at: string;
    head: {
        ref: string;
        sha: string;
        label: string;
    };
};

// get latest open PR for a given branch
export async function getPullRequestForBranch(
    branchName: string
): Promise<GithubAPIPullRequest | undefined> {
    const pullRequests = await fetch(
        `https://api.github.com/repos/${
            config.githubRepository
        }/pulls?state=open&head=${
            config.githubFork.split("/")[0]
        }:${branchName}&per_page=1`,
        fetchGithubOptions
    ).then((r) => r.json());
    return (pullRequests.length && pullRequests[0]) || undefined;
}

// parse and validate some markdown file from raw.githubcontent.com
export async function fetchGithubMarkdown<T extends ZodSchema>({
    ref = "master",
    schema,
    path,
    overrides,
}: {
    ref?: string;
    schema: T;
    path: string;
    overrides?: (
        values: Record<string, any>,
        body: string
    ) => Record<string, any>;
}): Promise<{ attributes: z.infer<T>; body: string; error?: ZodError }> {
    const repo = ref === "master" ? config.githubRepository : config.githubFork;
    const mdUrl = `https://raw.githubusercontent.com/${repo}/${ref}/${path}`;
    console.log(`Fetching ${mdUrl}`);
    const mdData = await fetch(mdUrl, { cache: "no-store" }).then((r) =>
        r.text()
    );

    const {
        attributes,
        body,
    }: { attributes: Record<string, any>; body: string } = fm(mdData);

    const parsedData = schema.parse({
        ...attributes,
        ...(overrides ? overrides(attributes, body) : {}),
        id: path.replace(/^.*\/([^/]+)\.md$/, "$1"),
    });

    return {
        attributes: parsedData,
        body,
    };
}

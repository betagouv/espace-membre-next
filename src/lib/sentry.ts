import * as Sentry from "@sentry/node";
import { CustomError as LibraryCustomError } from "ts-custom-error";
import { z } from "zod";

import { AccountService, SERVICES } from "@/models/services";
import config from "@/server/config";

export enum SentryRole {
    admin = "admin",
    contributor = "contributor",
}

const sentryTeamAccessSchema = z.object({
    teamSlug: z.string(),
    teamRole: z.nativeEnum(SentryRole),
});

export type SentryTeamAccess = z.infer<typeof sentryTeamAccessSchema>;

export interface SentryAddUserToOrgParams {
    email: string;
    teamRoles: SentryTeamAccess[];
    orgRole: "member" | "admin";
}

export interface SentryAddUserToTeamParams {
    memberId: string;
    teamSlug: string;
}

export const initializeSentry = (app) => {
    if (!config.sentryDSN) {
        console.log("Sentry DSN not found. Sentry is not initialized.");
        return;
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 1.0,
    });
};

export interface SentryUser {
    id: string;
    email: string;
    name?: string; // Optional
}

export interface SentryTeam {
    members: any;
    id: string;
    slug: string;
    name: string;
    memberCount: number;
    projects: SentryProject[];
}

export interface SentryProject {
    id: string;
    slug: string;
    name: string;
    plateform: string;
}

export interface SentryUserAccess {
    role: "admin" | "member" | "manager" | "owner";
    id: string;
    email: string;
    name: string;
    pending: boolean;
    expired: boolean;
    inviteStatus: "approved" | "pending";
    teams: string[]; // teams slugs
    teamRoles: SentryTeamAccess[];
}

export class SentryService implements AccountService {
    private apiUrl: string;
    private authToken: string;
    public name = SERVICES.SENTRY;
    private headers: { Authorization: string; "Content-Type": string };
    org: string;

    constructor(apiUrl: string, authToken: string, org: string) {
        this.apiUrl = apiUrl;
        this.authToken = authToken;
        this.org = org;
        this.headers = {
            Authorization: `Bearer ${this.authToken}`,
            "Content-Type": "application/json", // Optional, but good practice
        };
    }

    /**
     * Delete a user by login id Sentry API
     * @param userId - The id of the user to delete
     */
    async deleteUserByServiceId(userId: string): Promise<void> {
        // Step 2: Delete the user
        const deleteResponse = await fetch(
            `${this.apiUrl}/api/0/organizations/${this.org}/members/${userId}/`,
            {
                method: "DELETE",
                headers: this.headers,
            }
        );

        if (!deleteResponse.ok) {
            throw new Error(
                `Failed to delete user: ${deleteResponse.statusText}`
            );
        }
        console.log(`User with email ${userId} deleted successfully.`);
    }

    /**
     * fetch a user access by login using Sentry API
     * @param userId - The login of the user to delete
     */
    async fetchUserAccess(userId: string): Promise<SentryUserAccess> {
        const userTeamsUrl = `${this.apiUrl}/api/0/organizations/${this.org}/members/${userId}/`;
        const response = await fetch(userTeamsUrl, {
            headers: this.headers,
            method: "GET",
        });

        if (response.status === 404) {
            throw userNotFound;
        }
        if (!response.ok) {
            throw new Error(`Failed to get user: ${response.statusText}`);
        }
        return await response.json();
    }

    async regenerateInviteForUser({
        sentryUserId,
    }: {
        sentryUserId: string;
    }): Promise<{ regenerate: boolean; reinvite: boolean }> {
        const res = await fetch(
            `${this.apiUrl}/api/0/organizations/${this.org}/members/${sentryUserId}/`,
            {
                headers: this.headers,
                body: JSON.stringify({
                    regenerate: true,
                    reinvite: true,
                }),
                method: "PUT",
            }
        );
        return res.json();
    }

    async addUserToOrganization({
        email,
        teamRoles,
        orgRole = "member",
    }: SentryAddUserToOrgParams): Promise<SentryUser> {
        // Add user to the organization
        // it sents 404 errors if an invitation is pending
        // it send a 200 response if wrong params sent without any other information
        const response = await fetch(
            `${this.apiUrl}/api/0/organizations/${this.org}/members/`,
            {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    email,
                    orgRole,
                    teamRoles: teamRoles.map((t) => ({
                        teamSlug: t.teamSlug,
                        role: t.teamRole, // role 'admin' is never taken into account by sentry
                    })),
                    sendInvite: true,
                    reinvite: true,
                }),
            }
        );

        if (response.status === 201) {
            console.log("User add to organization", teamRoles, orgRole);
            return response.json();
        } else {
            const contentType = response.headers.get("Content-Type");
            if (contentType?.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(
                    `Failed to add user to organization: ${response.status} ${response.statusText}. ${errorData.detail}`
                );
            } else {
                // Handle non-JSON response if needed, or return the raw text
                throw new Error(
                    `Failed to add user ${email} to organization: ${response.status} ${response.statusText}`
                );
            }
        }
    }

    async changeMemberRoleInTeam({
        memberId,
        teamRole,
        teamSlug,
    }): Promise<void> {
        const url = `${this.apiUrl}/api/0/organizations/${this.org}/members/${memberId}/teams/${teamSlug}/`;
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${this.authToken}`, // Sentry API token
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                teamRole,
            }),
        });

        if (response.status === 404) {
            throw userAlreadyHaveDefinedRoleOrTeamDoesNotExist;
        }
        if (response.status === 200) {
            await response.json();
            console.log(
                `Sentry: User ${memberId} changed team role to ${teamRole} in team ${teamSlug}`
            );
        } else {
            const contentType = response.headers.get("Content-Type");
            if (contentType?.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(
                    `Failed to changed user role : ${response.status} ${response.statusText}. ${errorData.detail}`
                );
            } else {
                // Handle non-JSON response if needed, or return the raw text
                throw new Error(
                    `Failed to changed user role : ${response.status} ${response.statusText}`
                );
            }
        }

        return;
    }

    async createSentryTeam({ teamName, teamSlug }): Promise<void> {
        // it sends 404 error when sentryTeam already exists
        const url = `${this.apiUrl}/api/0/organizations/${this.org}/teams/`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.authToken}`, // Sentry API token
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                slug: teamSlug,
                name: teamName,
            }),
        });
        if (response.status === 404) {
            throw teamAlreadyExistsError;
        }
        if (response.status === 201) {
            console.log(`Sentry: team ${teamName} created in team ${teamSlug}`);
            return response.json();
        } else {
            const contentType = response.headers.get("Content-Type");
            if (contentType?.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(
                    `Failed to create team: ${response.status} ${response.statusText}. ${errorData.detail}`
                );
            } else {
                // Handle non-JSON response if needed, or return the raw text
                throw new Error(
                    `Failed to create team: ${response.status} ${response.statusText}`
                );
            }
        }
    }

    async addUserToTeam({
        memberId,
        teamSlug,
    }: SentryAddUserToTeamParams): Promise<void> {
        // there is no search api so we have to fetch all users and then filter

        const url = `${this.apiUrl}/api/0/organizations/${this.org}/members/${memberId}/teams/${teamSlug}/`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.authToken}`, // Sentry API token
                "Content-Type": "application/json",
            },
        });
        if (response.status === 201) {
            console.log(
                `Sentry: User ${memberId} successfully added to the team:`
            );
        } else if (response.status === 204) {
            console.log("Sentry user already in team");
        } else if (response.status === 202) {
            console.log(
                "The member needs permission to join the team and an access request has been generated"
            );
        } else {
            throw new Error(
                `Failed to add user to team: ${response.status} ${response.statusText}.`
            );
        }
        return;
    }

    // Function to get teams the user belongs to
    async getAllTeams(): Promise<SentryTeam[]> {
        let nextPageUrl:
            | string
            | null = `${this.apiUrl}/api/0/organizations/${this.org}/teams/`;
        let allTeams: SentryTeam[] = [];
        while (nextPageUrl) {
            const teamsResponse = await fetch(nextPageUrl, {
                method: "GET",
                headers: this.headers,
            });

            if (!teamsResponse.ok) {
                throw new Error(
                    `Failed to fetch teams: ${teamsResponse.statusText}`
                );
            }

            const teamsData: SentryTeam[] = await teamsResponse.json();
            allTeams = allTeams.concat(teamsData);

            // Check for pagination in the Link header
            const linkHeader = teamsResponse.headers.get("Link");
            nextPageUrl = this.getNextPageUrl(linkHeader);
        }
        // removed pending teams
        return allTeams;
    }

    // Function to fetch all teams from Sentry
    async getAllUsers(): Promise<
        { serviceUserId: string; user: SentryUser }[]
    > {
        let allUsers: SentryUser[] = [];
        let nextPageUrl:
            | string
            | null = `${this.apiUrl}/api/0/organizations/${this.org}/members/`;

        while (nextPageUrl) {
            const usersResponse = await fetch(nextPageUrl, {
                method: "GET",
                headers: this.headers,
            });

            if (!usersResponse.ok) {
                throw new Error(
                    `Failed to fetch users: ${usersResponse.statusText}`
                );
            }

            const usersData: SentryUser[] = await usersResponse.json();
            allUsers = allUsers.concat(usersData);

            // Check for pagination in the Link header
            const linkHeader = usersResponse.headers.get("Link");
            nextPageUrl = this.getNextPageUrl(linkHeader);
        }
        // removed pending users
        return allUsers.map((user) => ({
            user: user,
            serviceUserId: user.id,
        }));
    }

    getNextPageUrl(linkHeader: string | null): string | null {
        if (!linkHeader) return null;

        const links = linkHeader.split(",");
        for (let link of links) {
            const [urlPart, relPart, resultPart] = link.split(";");
            if (
                relPart.includes('rel="next"') &&
                resultPart.includes('results="true"')
            ) {
                return urlPart.trim().slice(1, -1); // Remove angle brackets around URL
            }
        }

        return null;
    }
}

export class CustomError extends LibraryCustomError {
    public constructor(public readonly code: string, message: string = "") {
        super(message);
    }

    public json(): object {
        return {
            code: this.code,
            message: this.message,
        };
    }
}

const t = (key: string) => {
    return key;
};

export class UnexpectedError extends CustomError {}

export class SentryError extends CustomError {
    public constructor(
        code: string,
        message: string = "",
        public readonly httpCode?: number
    ) {
        super(code, message);
    }

    public cloneWithHttpCode(httpCode: number): SentryError {
        return new SentryError(this.code, this.message, httpCode);
    }
}

export const teamAlreadyExistsError = new SentryError(
    "teamAlreadyExists",
    "Sentry team already exists"
);

export const userAlreadyHaveDefinedRoleOrTeamDoesNotExist = new SentryError(
    "userAlreadyHaveDefinedRoleOrTeamDoesNotExist",
    "User already have defined role or team dost not exist"
);

export const userNotFound = new SentryError(
    "userDoesNotExist",
    "User does not exist"
);

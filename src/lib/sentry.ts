import * as Sentry from "@sentry/node";

import config from "@/server/config";
import { AccountService, SERVICES } from "@/server/config/services.config";

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
    teamRoles: {
        teamSlug: string;
        role: "admin" | "contributor" | null; // role is null if users has highest privelege at organization level
    }[];
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

        if (!response.ok) {
            throw new Error(`Failed to get user: ${response.statusText}`);
        }
        return await response.json();
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

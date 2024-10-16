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
        console.log("LCS DELETE USER BY SERVICE ID", userId);
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

    // Function to fetch all users from Sentry
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

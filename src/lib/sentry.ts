import * as Sentry from "@sentry/node";
import { ErrorRequestHandler } from "express";

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

    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
};

export const sentryErrorHandler: ErrorRequestHandler =
    Sentry.Handlers.errorHandler();

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
     * Delete a user by login using Matomo API
     * @param userId - The id of the user to delete
     */
    async deleteUserById(userId: string): Promise<void> {
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
     * Delete a user by email.
     * @param email - The email of the user to delete
     */
    async deleteUserByEmail(email: string): Promise<void> {
        try {
            const usersData = await this.getAllUsers();
            const user = usersData.find((user: any) => user.email === email);

            if (!user) {
                console.log(`User with email ${email} not found.`);
                return;
            }
            await this.deleteUserById(user.id);
            console.log(`User with email ${email} deleted successfully.`);
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    }

    // Function to fetch all users from Matomo
    async getAllUsers(): Promise<SentryUser[]> {
        // Step 1: Get the list of users
        const usersResponse = await fetch(
            `${this.apiUrl}/api/0/organizations/${this.org}/members/`,
            {
                method: "GET",
                headers: this.headers,
            }
        );

        if (!usersResponse.ok) {
            throw new Error(
                `Failed to fetch users: ${usersResponse.statusText}`
            );
        }

        const usersData: SentryUser[] = await usersResponse.json();

        return usersData;
    }
}

// matomoClient.ts

import { AccountService, SERVICES } from "@/server/config/services.config";

// Define an interface for the Matomo User
export interface MatomoUser {
    login: string;
    email: string;
    alias: string;
    superuser_access: string;
    date_registered: string;
}

export class Matomo implements AccountService {
    private apiUrl: string;
    private authToken: string;
    public name = SERVICES.MATOMO;

    constructor(apiUrl: string, authToken: string) {
        this.apiUrl = apiUrl;
        this.authToken = authToken;
    }

    /**
     * Fetch user by email using Matomo API
     * @param email - The email of the user
     */
    async getUserByEmail(email: string): Promise<any> {
        const response = await fetch(`${this.apiUrl}/index.php`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                module: "API",
                method: "UsersManager.getUsers",
                format: "json",
                filter_limit: "1",
                filter_pattern: encodeURIComponent(email),
                token_auth: this.authToken,
            }),
        });

        if (!response.ok) {
            throw new Error(`Error fetching user: ${response.statusText}`);
        }

        const users = await response.json();
        return users.length ? users[0] : null;
    }

    /**
     * Delete a user by login using Matomo API
     * @param userLogin - The login of the user to delete
     */
    async deleteUserByServiceId(userLogin: string): Promise<void> {
        const response = await fetch(`${this.apiUrl}/index.php`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                module: "API",
                method: "UsersManager.deleteUser",
                userLogin: encodeURIComponent(userLogin),
                token_auth: this.authToken,
                format: "json",
            }),
        });

        if (!response.ok) {
            throw new Error(`Error deleting user: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(
            result.result === "success"
                ? `User with login: ${userLogin} successfully deleted.`
                : `Failed to delete user with login: ${userLogin}.`
        );
    }

    /**
     * Delete a user by email.
     * @param email - The email of the user to delete
     */
    async deleteUserByEmail(email: string): Promise<void> {
        const user = await this.getUserByEmail(email);
        if (user) {
            await this.deleteUserByServiceId(user.login);
        } else {
            console.log(`No user found with email: ${email}`);
        }
    }

    // Function to fetch all users from Matomo
    async getAllUsers(): Promise<(MatomoUser & { serviceId: string })[]> {
        let allUsers: MatomoUser[] = [];
        let offset = 0;
        const limit = 100; // Adjust the limit per request as needed

        try {
            while (true) {
                const response = await fetch(`${this.apiUrl}/index.php`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        module: "API",
                        method: "UsersManager.getUsers",
                        format: "json",
                        token_auth: this.authToken,
                        filter_limit: String(limit),
                        filter_offset: String(offset),
                    }),
                });

                if (!response.ok) {
                    throw new Error(
                        `Error fetching users: ${response.status} ${response.statusText}`
                    );
                }

                const users: MatomoUser[] = await response.json();
                if (users.length === 0) {
                    break; // Exit the loop if no more users are returned
                }

                allUsers = allUsers.concat(users);
                offset += limit;
            }

            // Optionally, you could add validation or transformation of the data here if needed
            return allUsers.map((user) => ({
                ...user,
                serviceId: user.login,
            }));
        } catch (error) {
            console.error("Failed to fetch Matomo users:", error);
            throw error;
        }
    }
}

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

export interface MatomoSite {
    idsite: number;
    name: string;
    main_url: string;
    type: string;
}

export interface MatomoUserAccess {
    site: number;
    access: "admin" | "view"; // Define access levels you want to check
}

export class Matomo implements AccountService {
    private apiUrl: string;
    private authToken: string;
    public name = SERVICES.MATOMO;

    constructor(apiUrl: string, authToken: string) {
        this.apiUrl = apiUrl;
        this.authToken = authToken;
    }

    async getAllSites(): Promise<MatomoSite[]> {
        let allSites: MatomoSite[] = [];
        let offset = 0;
        const limit = 100;
        try {
            while (true) {
                const response = await fetch(`${this.apiUrl}/index.php`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        module: "API",
                        method: "SitesManager.getAllSites",
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

                const sites: MatomoSite[] = await response.json();
                if (sites.length === 0) {
                    break; // Exit the loop if no more users are returned
                }

                allSites = allSites.concat(sites);
                offset += limit;
            }

            return allSites;
        } catch (error) {
            console.error("Failed to fetch Matomo sites:", error);
            throw error;
        }
    }

    /**
     * Fetch user by email using Matomo API
     * @param email - The email of the user
     */
    async getUserByEmail(email: string): Promise<MatomoUser | null> {
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
     * fetch a user access by login using Matomo API
     * @param userLogn - The login of the user to delete
     */
    async fetchUserAccess(userLogin: string): Promise<MatomoUserAccess[]> {
        const response = await fetch(`${this.apiUrl}/index.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                module: "API",
                method: "UsersManager.getSitesAccessFromUser",
                format: "JSON",
                token_auth: this.authToken,
                userLogin: userLogin,
            }),
        });

        return response.json();
    }

    // Function to fetch all users from Matomo
    async getAllUsers(): Promise<
        { user: MatomoUser; serviceUserId: string }[]
    > {
        let allUsers: MatomoUser[] = [];
        let offset = 0;
        const limit = 100;
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
                user: user,
                serviceUserId: user.login,
            }));
        } catch (error) {
            console.error("Failed to fetch Matomo users:", error);
            throw error;
        }
    }
}

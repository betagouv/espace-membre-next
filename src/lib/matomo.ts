// matomoClient.ts

import { AccountService, SERVICES } from "@/models/services";

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
    idSite: number;
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

    /**
     * Create a new user in Matomo using the Matomo API
     * @param userLogin - The login username for the new user
     * @param password - The password for the new user
     * @param email - The email address of the new user
     * @param alias - The display name or alias for the new user
     * @returns A Promise resolving to the response from Matomo API
     */
    async createUser({
        userLogin,
        password,
        email,
        alias,
    }: {
        userLogin: string;
        password: string;
        email: string;
        alias: string;
    }): Promise<void> {
        const response = await fetch(`${this.apiUrl}/index.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                module: "API",
                method: "UsersManager.addUser",
                format: "JSON",
                token_auth: this.authToken,
                userLogin: userLogin,
                password: password,
                email: email,
                alias: alias,
            }),
        });
        // Check if the response is ok and handle errors
        if (!response.ok) {
            throw new Error(`Failed to create user: ${response.statusText}`);
        }
        const responseBody = await response.json();
        // if sucess response body = { result: 'success', message: 'ok' }
        if (responseBody.result === "error") {
            throw new Error(`Failed to create user: ${responseBody.result}`);
        }

        return;
    }

    /**
     * Give a user access to a specific site with a specified role using Matomo API
     * @param {string} userLogin - The login of the user to grant access
     * @param {string} siteId - The ID of the site to grant access to
     * @param {string} access - The level of access to grant (e.g., "view", "admin")
     * @returns {Promise<any>} A promise resolving to the response from Matomo API
     */
    async grantUserAccess({
        userLogin,
        idSites,
        access,
    }: {
        userLogin: string;
        idSites: number[];
        access: "admin" | "view";
    }): Promise<void> {
        try {
            const response = await fetch(`${this.apiUrl}/index.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    module: "API",
                    method: "UsersManager.setUserAccess",
                    format: "JSON",
                    token_auth: this.authToken,
                    userLogin: userLogin,
                    idSites: idSites.join(","),
                    access: access,
                }),
            });

            const responseBody = await response.json();
            // if sucess response body = { result: 'success', message: 'ok' }
            if (responseBody.result === "error") {
                throw new Error(
                    `Failed to create user: ${responseBody.result}`
                );
            }

            return;
        } catch (error) {
            console.error("Failed to set user access:", error);
            throw error;
        }
    }

    /**
     * Create a new site only if it doesn't already exist in Matomo
     * @param siteName - The name of the site
     * @param urls - Array of URLs for the site
     * @param siteType - The type of site ("website" or "mobileapp")
     * @returns The site ID of the existing or newly created site
     */
    async getSiteOrCreate(
        siteName: string,
        urls: string[],
        siteType: "website" | "mobileapp" = "website"
    ): Promise<number> {
        // Check if a site with the given URL already exists
        const existingSiteId = await fetch(`${this.apiUrl}/index.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                module: "API",
                method: "SitesManager.getSitesIdFromSiteUrl",
                format: "JSON",
                token_auth: this.authToken,
                url: urls[0], // Check the first URL (you can loop for multiple URLs if needed)
            }),
        }).then((response) => response.json());
        if (existingSiteId.length > 0) {
            // Site with this URL already exists
            return existingSiteId[0].idsite; // Return the existing site ID
        }

        // If no site exists, create a new one
        const response = await fetch(`${this.apiUrl}/index.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                module: "API",
                method: "SitesManager.addSite",
                format: "JSON",
                token_auth: this.authToken,
                siteName: siteName,
                urls: JSON.stringify(urls),
                type: siteType,
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to create site: ${response.statusText}`);
        }

        const newSite = await response.json();
        return newSite.value; // Return the new site ID
    }

    /**
     * Create a new site or app in Matomo using the Matomo API
     * @param siteName - The name of the site or app
     * @param urls - An array of URLs associated with the site or app
     * @param siteType - Type of site, e.g., "website" or "mobileapp" (optional)
     * @returns A Promise resolving to the response from the Matomo API
     */
    async createSite(
        siteName: string,
        urls: string[],
        siteType: "website" | "mobileapp" = "website"
    ): Promise<{ value: string }> {
        const response = await fetch(`${this.apiUrl}/index.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                module: "API",
                method: "SitesManager.addSite",
                format: "JSON",
                token_auth: this.authToken,
                siteName: siteName,
                urls: JSON.stringify(urls), // URLs should be a JSON array string
                type: siteType,
            }),
        });

        // Check if the response is ok and handle errors
        if (!response.ok) {
            throw new Error(`Failed to create site: ${response.statusText}`);
        }

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

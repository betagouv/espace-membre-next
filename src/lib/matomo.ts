// matomoClient.ts
export class MatomoClient {
    private apiUrl: string;
    private authToken: string;

    constructor(apiUrl: string, authToken: string) {
        this.apiUrl = apiUrl;
        this.authToken = authToken;
    }

    /**
     * Fetch user by email using Matomo API
     * @param email - The email of the user
     */
    async getUserByEmail(email: string): Promise<any> {
        const response = await fetch(
            `${
                this.apiUrl
            }/index.php?module=API&method=UsersManager.getUsers&format=json&filter_limit=1&filter_pattern=${encodeURIComponent(
                email
            )}&token_auth=${this.authToken}`
        );
        if (!response.ok) {
            throw new Error(`Error fetching user: ${response.statusText}`);
        }

        const users = await response.json();

        if (users.length === 0) {
            console.log(`No user found with email: ${email}`);
            return null;
        }

        return users[0]; // Assuming the first user is the match
    }

    /**
     * Delete a user by login using Matomo API
     * @param userLogin - The login of the user to delete
     */
    async deleteUserByLogin(userLogin: string): Promise<void> {
        const response = await fetch(
            `${
                this.apiUrl
            }/index.php?module=API&method=UsersManager.deleteUser&userLogin=${encodeURIComponent(
                userLogin
            )}&token_auth=${this.authToken}&format=json`
        );

        if (!response.ok) {
            throw new Error(`Error deleting user: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.result === "success") {
            console.log(`User with login: ${userLogin} successfully deleted.`);
        } else {
            console.log(`Failed to delete user with login: ${userLogin}.`);
        }
    }

    /**
     * Delete a user by email. This function combines getUserByEmail and deleteUserByLogin
     * @param email - The email of the user to delete
     */
    async deleteUserByEmail(email: string): Promise<void> {
        const user = await this.getUserByEmail(email);
        if (user) {
            await this.deleteUserByLogin(user.login);
        } else {
            console.log(`No user found with email: ${email}`);
        }
    }
}

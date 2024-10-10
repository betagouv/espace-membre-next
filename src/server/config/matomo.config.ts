import config from ".";
import { AccountService, SERVICES } from "./services.config";
import { Matomo, MatomoUser } from "@/lib/matomo";

export class FakeMatomo implements AccountService {
    users: MatomoUser[] = [];
    public name = SERVICES.MATOMO;

    constructor(users: MatomoUser[]) {
        this.users = users;
    }
    deleteUserByServiceId(userLogin: string): Promise<void> {
        this.users = this.users.filter((user) => user.login != userLogin);
        return Promise.resolve();
    }
    getAllUsers(): Promise<
        { user: { email: string }; serviceUserId: string }[]
    > {
        return Promise.resolve(
            this.users.map((user) => ({
                user: user,
                serviceUserId: user.login,
            }))
        );
    }
    deleteUserByEmail(email: string): Promise<void> {
        this.users = this.users.filter((user) => user.email != email);
        return Promise.resolve();
    }
}

export const matomoClient =
    process.env.NODE_ENV !== "test"
        ? new Matomo(config.MATOMO_API_URL!, config.MATOMO_TOKEN!)
        : new FakeMatomo([]);

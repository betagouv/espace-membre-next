import config from ".";
import { AccountService, SERVICES } from "./services.config";
import { Matomo, MatomoUser, MatomoUserAccessDetails } from "@/lib/matomo";

export class FakeMatomo implements AccountService {
    users: MatomoUser[] = [];
    public name = SERVICES.MATOMO;
    userAccess: (MatomoUserAccessDetails & { login: MatomoUser["login"] })[];

    constructor(
        users: MatomoUser[],
        userAccess: (MatomoUserAccessDetails & {
            login: MatomoUser["login"];
        })[] = []
    ) {
        this.users = users;
        this.userAccess = userAccess;
    }
    deleteUserByServiceId(userLogin: string): Promise<void> {
        this.users = this.users.filter((user) => user.login != userLogin);
        return Promise.resolve();
    }
    fetchUserAccess(userLogin: string): Promise<MatomoUserAccessDetails[]> {
        return Promise.resolve(
            this.userAccess
                .filter((userAccess) => userAccess.login == userLogin)
                .map((userAccess) => {
                    const { login, ...rest } = userAccess;
                    return rest;
                })
        );
    }
    getAllUsers(): Promise<{ user: MatomoUser; serviceUserId: string }[]> {
        return Promise.resolve(
            this.users.map((user) => ({
                user: user,
                serviceUserId: user.login,
            }))
        );
    }
}

export const matomoClient =
    process.env.NODE_ENV !== "test"
        ? new Matomo(config.MATOMO_API_URL!, config.MATOMO_TOKEN!)
        : new FakeMatomo([]);

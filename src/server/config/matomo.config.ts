import config from ".";
import { Matomo, MatomoSite, MatomoUser, MatomoUserAccess } from "@/lib/matomo";
import { AccountService, SERVICES } from "@/models/services";

export class FakeMatomo implements AccountService {
    users: MatomoUser[] = [];
    public name = SERVICES.MATOMO;
    userAccess: (MatomoUserAccess & { login: MatomoUser["login"] })[];
    sites: MatomoSite[] = [];
    constructor(
        users: MatomoUser[],
        userAccess: (MatomoUserAccess & {
            login: MatomoUser["login"];
        })[] = [],
        sites: MatomoSite[] = []
    ) {
        this.users = users;
        this.userAccess = userAccess;
        this.sites = sites;
    }
    deleteUserByServiceId(userLogin: string): Promise<void> {
        this.users = this.users.filter((user) => user.login != userLogin);
        return Promise.resolve();
    }
    fetchUserAccess(userLogin: string): Promise<MatomoUserAccess[]> {
        return Promise.resolve(
            this.userAccess
                .filter((userAccess) => userAccess.login == userLogin)
                .map((userAccess) => {
                    const { login, ...rest } = userAccess;
                    return rest;
                })
        );
    }
    getAllSites(): Promise<MatomoSite[]> {
        return Promise.resolve(this.sites);
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

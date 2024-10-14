import config from ".";
import { AccountService, SERVICES } from "./services.config";
<<<<<<< HEAD
import { Matomo, MatomoSite, MatomoUser, MatomoUserAccess } from "@/lib/matomo";
=======
import { Matomo, MatomoUser, MatomoUserAccessDetails } from "@/lib/matomo";
>>>>>>> 31a3ff7 (chore(syncMatomoAccount): added tests, added matomo fetchUserAccess)

export class FakeMatomo implements AccountService {
    users: MatomoUser[] = [];
    public name = SERVICES.MATOMO;
<<<<<<< HEAD
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
=======
    userAccess: (MatomoUserAccessDetails & { login: MatomoUser["login"] })[];

    constructor(
        users: MatomoUser[],
        userAccess: (MatomoUserAccessDetails & {
            login: MatomoUser["login"];
        })[] = []
    ) {
        this.users = users;
        this.userAccess = userAccess;
>>>>>>> 31a3ff7 (chore(syncMatomoAccount): added tests, added matomo fetchUserAccess)
    }
    deleteUserByServiceId(userLogin: string): Promise<void> {
        this.users = this.users.filter((user) => user.login != userLogin);
        return Promise.resolve();
    }
<<<<<<< HEAD
    fetchUserAccess(userLogin: string): Promise<MatomoUserAccess[]> {
=======
    fetchUserAccess(userLogin: string): Promise<MatomoUserAccessDetails[]> {
>>>>>>> 31a3ff7 (chore(syncMatomoAccount): added tests, added matomo fetchUserAccess)
        return Promise.resolve(
            this.userAccess
                .filter((userAccess) => userAccess.login == userLogin)
                .map((userAccess) => {
                    const { login, ...rest } = userAccess;
                    return rest;
                })
        );
    }
<<<<<<< HEAD
    getAllSites(): Promise<MatomoSite[]> {
        return Promise.resolve(this.sites);
    }

=======
>>>>>>> 31a3ff7 (chore(syncMatomoAccount): added tests, added matomo fetchUserAccess)
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

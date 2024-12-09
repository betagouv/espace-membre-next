import config from ".";
import {
    Matomo,
    MatomoAccess,
    MatomoSite,
    MatomoUser,
    MatomoUserAccess,
} from "@/lib/matomo";
import { AccountService, SERVICES } from "@/models/services";

export class FakeMatomo implements AccountService {
    users: MatomoUser[] = [];
    public name = SERVICES.MATOMO;
    private lastId = 1000; // arbitrary choose to start at 1000
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
    createUser({
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
        const user = {
            login: userLogin,
            email,
            alias,
            superuser_access: "",
            date_registered: "",
        };
        this.users.push(user);
        return Promise.resolve();
    }

    getSiteOrCreate(
        siteName: string,
        urls: string[],
        siteType: "website" | "mobileapp" = "website"
    ): Promise<number> {
        const existingSite = this.sites.find((s) => s.main_url === urls[0]);
        if (existingSite) {
            return Promise.resolve(existingSite.idsite);
        }
        return this.createSite(siteName, urls, siteType);
    }

    createSite(
        siteName: string,
        urls: string[],
        siteType: "website" | "mobileapp" = "website"
    ): Promise<any> {
        const newId = this.lastId + 1;
        this.sites.push({
            idsite: newId,
            name: siteName,
            main_url: urls[0],
            type: siteType,
        });
        this.lastId = newId;
        return Promise.resolve();
    }

    async grantUserAccess({
        userLogin,
        idSites,
        access,
    }: {
        userLogin: string;
        idSites: number[];
        access: MatomoAccess;
    }): Promise<void> {
        idSites.forEach((id) => {
            this.userAccess.push({
                idSite: id,
                name: "",
                main_url: "",
                type: "",
                site: id,
                access: access || MatomoAccess.admin,
                login: userLogin,
            });
        });
        return Promise.resolve();
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

import config from ".";
import { AccountService, SERVICES } from "./services.config";
import {
    SentryService,
    SentryTeam,
    SentryUser,
    SentryUserAccess,
} from "@/lib/sentry";

export class FakeSentryService implements AccountService {
    users: SentryUser[] = [];
    public name = SERVICES.SENTRY;
    teams: SentryTeam[];
    userAccess: SentryUserAccess[];

    constructor(
        users: SentryUser[],
        teams: SentryTeam[] = [],
        userAccess: SentryUserAccess[] = []
    ) {
        this.users = users;
        this.teams = teams;
        this.userAccess = userAccess;
    }
    deleteUserByServiceId(id: string): Promise<void> {
        this.users = this.users.filter((user) => user.id != id);
        return Promise.resolve();
    }
    getAllTeams(): Promise<SentryTeam[]> {
        return Promise.resolve(this.teams);
    }
    fetchUserAccess(userId: string): Promise<SentryUserAccess> {
        return Promise.resolve(
            this.userAccess
                .filter((userAccess) => userAccess.id === userId)
                .map((userAccess) => {
                    return userAccess;
                })[0]
        );
    }
    getAllUsers(): Promise<{ user: SentryUser; serviceUserId: string }[]> {
        return Promise.resolve(
            this.users.map((user) => ({
                user: user,
                serviceUserId: user.id,
            }))
        );
    }
}

export const sentryClient =
    process.env.NODE_ENV !== "test"
        ? new SentryService(
              config.SENTRY_API_URL!,
              config.SENTRY_TOKEN!,
              config.SENTRY_ORGANIZATION!
          )
        : new FakeSentryService([]);

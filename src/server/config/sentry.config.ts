import config from ".";
import { AccountService, SERVICES } from "./services.config";
import { SentryService, SentryUser, SentryUserDetail } from "@/lib/sentry";

export class FakeSentryService implements AccountService {
    users: SentryUser[] = [];
    public name = SERVICES.SENTRY;
    teams: SentryUserDetail[];

    constructor(users: SentryUser[]) {
        this.users = users;
    }
    deleteUserByServiceId(id: string): Promise<void> {
        this.users = this.users.filter((user) => user.id != id);
        return Promise.resolve();
    }
    getUserTeams(): Promise<SentryUserDetail> {
        return this.teams;
    }
    getAllUsers(): Promise<
        { user: { email: string }; serviceUserId: string }[]
    > {
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

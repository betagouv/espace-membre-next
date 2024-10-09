import config from ".";
import { AccountService, SERVICES } from "./services.config";
import { SentryService, SentryUser } from "@/lib/sentry";

export class FakeSentryService implements AccountService {
    users: SentryUser[] = [];
    public name = SERVICES.SENTRY;

    constructor(users: SentryUser[]) {
        this.users = users;
    }
    getAllUsers(): Promise<{ email: string }[]> {
        return Promise.resolve(this.users);
    }
    deleteUserByEmail(email: string): Promise<void> {
        this.users = this.users.filter((user) => user.email != email);
        return Promise.resolve();
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

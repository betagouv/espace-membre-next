export enum SERVICES {
    MATOMO = "matomo",
    SENTRY = "sentry",
    MATTERMOST = "mattermost",
}

// Define a generic service interface for deleting accounts
export interface AccountService {
    name: SERVICES;
    getAllUsers(): Promise<
        { user: { email: string }; serviceUserId: string }[]
    >;
    deleteUserByServiceId(id: string): Promise<void>;
}

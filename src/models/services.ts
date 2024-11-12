export enum SERVICES {
    MATOMO = "matomo",
    SENTRY = "sentry",
    MATTERMOST = "mattermost",
}

export enum ACCOUNT_SERVICE_STATUS {
    ACCOUNT_CREATION_PENDING = "ACCOUNT_CREATION_PENDING",
    ACCOUNT_FOUND = "ACCOUNT_FOUND",
}

// Define a generic service interface for deleting accounts
export interface AccountService {
    name: SERVICES;
    getAllUsers(): Promise<
        { user: { email: string }; serviceUserId: string }[]
    >;
    deleteUserByServiceId(id: string): Promise<void>;
}
export enum SERVICES {
    MATOMO = "matomo",
    SENTRY = "sentry",
}

// Define a generic service interface for deleting accounts
export interface AccountService {
    name: SERVICES;
    getAllUsers(): Promise<{ email: string }[]>;
    deleteUserByEmail(email: string): Promise<void>;
}

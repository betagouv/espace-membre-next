// Define a generic service interface for deleting accounts
export interface AccountService {
    getAllUsers(): Promise<{ email: string }[]>;
    deleteUserByEmail(email: string): Promise<void>;
}

export enum SERVICES {
    MATOMO = "matomo",
    SENTRY = "sentry",
}

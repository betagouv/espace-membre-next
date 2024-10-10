export enum SERVICES {
    MATOMO = "matomo",
    SENTRY = "sentry",
}

// Define a generic service interface for deleting accounts
export interface AccountService {
    name: SERVICES;
    getAllUsers(): Promise<{ email: string; serviceId: string }[]>;
    deleteUserByServiceId(id: string): Promise<void>;
    deleteUserByEmail(email: string): Promise<void>;
}

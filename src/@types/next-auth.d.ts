// next-auth.d.ts
import "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string; // Ajoutez l'ID utilisateur ici
            uuid: string;
            name?: string | null;
            email: string;
            image?: string | null;
            isAdmin: boolean;
            id_token?: string | null;
            provider?: string | null;
        };
    }
    interface User extends DefaultUser {
        id: string;
        email: string;
        emailVerified: Date | null;
        uuid: string;
        id_token?: string | null;
        provider?: string | null;
    }
    interface AdapterUser {
        id: string;
        email: string;
        emailVerified: Date | null;
        uuid: string;
    }
}

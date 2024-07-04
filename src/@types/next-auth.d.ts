// next-auth.d.ts
import "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string; // Ajoutez l'ID utilisateur ici
            uuid: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            isAdmin: boolean;
        };
    }
    interface User extends DefaultUser {
        id: string;
        email?: string;
        emailVerified: Date | null;
        uuid: string;
    }
    interface AdapterUser {
        id: string;
        email?: string;
        emailVerified: Date | null;
        uuid: string;
    }
}

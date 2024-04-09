// next-auth.d.ts
import "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string; // Ajoutez l'ID utilisateur ici
            name?: string | null;
            email?: string | null;
            image?: string | null;
            isAdmin: boolean;
        };
    }
}

declare module "next-auth" {
    interface AdapterUser {
        id: string;
        email: string;
        emailVerified: Date | null;
        id?: string;
    }
}

// function use by NextAuth to hashtoken, unfortunatly is not export by

import { createHash } from "crypto";

// next-auth, hopefully it will not change
export function hashToken(token: string, secret: string) {
    return (
        createHash("sha256")
            // Prefer provider specific secret, but use default secret if none specified
            .update(`${token}${secret}`)
            .digest("hex")
    );
}

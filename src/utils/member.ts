import crypto from "crypto";

import config from "@/server/config";

export const computeHash = function (username) {
    const hash = crypto.createHmac(
        "sha512",
        config.HASH_SALT as string
    ); /** Hashing algorithm sha512 */
    return hash.update(username).digest("hex");
};

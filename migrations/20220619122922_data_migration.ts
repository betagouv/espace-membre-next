/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const crypto = require("crypto");
    const users = await knex("users");
    const salt = process.env.HASH_SALT;
    if (salt === undefined) {
        throw new Error("HASH_SALT environment variable is not set");
    }
    for (const user of users) {
        var hash = crypto.createHmac(
            "sha512",
            salt
        ); /** Hashing algorithm sha512 */
        hash.update(user.username);
        var value = hash.digest("hex");
        await knex("user_details").insert({
            hash: value,
            gender: user.gender,
            tjm: user.tjm,
            active: user.primary_email_status === "EMAIL_ACTIVE",
        });
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex("user_details").truncate();
};

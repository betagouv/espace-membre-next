exports.up = function (knex) {
    return knex.schema
        .createTable("verification_token", function (table) {
            table.text("identifier").notNullable();
            table.timestamp("expires").notNullable();
            table.text("token").notNullable();
            table.primary(["identifier", "token"]);
        })
        .createTable("accounts", function (table) {
            table.increments("id").primary();
            table.integer("userId").notNullable();
            table.string("type", 255).notNullable();
            table.string("provider", 255).notNullable();
            table.string("providerAccountId", 255).notNullable();
            table.text("refresh_token");
            table.text("access_token");
            table.bigInteger("expires_at");
            table.text("id_token");
            table.text("scope");
            table.text("session_state");
            table.text("token_type");
        })
        .createTable("sessions", function (table) {
            table.increments("id").primary();
            table.integer("userId").notNullable();
            table.timestamp("expires").notNullable();
            table.string("sessionToken", 255).notNullable();
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists("verification_token")
        .dropTableIfExists("accounts")
        .dropTableIfExists("sessions");
};

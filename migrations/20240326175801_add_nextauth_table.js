exports.up = function (knex) {
    return knex.schema
        .createTable("verification_tokens", function (table) {
            table.text("identifier").notNullable();
            table.timestamp("expires").notNullable();
            table.text("token").notNullable();
            table.primary(["identifier", "token"]); // Correct usage for composite primary key
        })
        .createTable("accounts", function (table) {
            table.increments("id").primary(); // Corrected
            table.string("userId").notNullable();
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
            table.increments("id").primary(); // Corrected
            table.string("userId").notNullable();
            table.timestamp("expires").notNullable();
            table.string("sessionToken", 255).notNullable();
        })
        .alterTable("users", function (table) {
            // table.increments('id').primary(); // Added .primary() here
            // table.string('name', 255);
            // table.string('email', 255);
            table.timestamp("email_verified");
            // table.text('image');
        });
};

exports.down = function (knex) {
    return knex.schema
        .alterTable("users", async (table) => {
            table.dropColumn("email_verified");
        })
        .dropTableIfExists("sessions")
        .dropTableIfExists("accounts")
        .dropTableIfExists("verification_tokens");
};

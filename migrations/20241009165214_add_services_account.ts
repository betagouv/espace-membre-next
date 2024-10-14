exports.up = function (knex) {
    return knex.schema.createTable("service_accounts", (table) => {
        table
            .uuid("uuid")
            .primary()
            .notNullable()
            .defaultTo(knex.raw("uuid_generate_v4()"));
        table.uuid("user_id").nullable(); // we list the account that we cannnot linked to anyone
        table.string("account_type").notNullable(); // 'sentry', 'matomo', or others
        table.string("service_user_id").notNullable(); // ID of the user in the service
        table.jsonb("metadata"); // Metadata (site access for Matomo, project/team for Sentry)

        table
            .foreign("user_id")
            .references("uuid")
            .inTable("users")
            .onDelete("CASCADE");

        table.unique(["account_type", "service_user_id"]);

        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("service_accounts");
};

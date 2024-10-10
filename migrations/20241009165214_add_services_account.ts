exports.up = function (knex) {
    return knex.schema.createTable("service_accounts", (table) => {
        table
            .uuid("uuid")
            .primary()
            .notNullable()
            .defaultTo(knex.raw("uuid_generate_v4()"));
        table.uuid("user_id").notNullable();
        table.string("account_type").notNullable(); // 'sentry', 'matomo', or others
        table.string("service_user_id").notNullable(); // ID of the user in the service
        table.jsonb("metadata"); // Metadata (site access for Matomo, project/team for Sentry)

        // You can add a foreign key constraint to user_id if you have a users table
        table
            .foreign("user_id")
            .references("uuid")
            .inTable("users")
            .onDelete("CASCADE");

        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("service_accounts");
};

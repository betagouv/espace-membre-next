exports.up = function (knex) {
    return knex.schema.table("events", function (table) {
        // Add a new column 'highlighted_startups' that stores an array of UUIDs
        table.uuid("action_on_startup").nullable();
        table
            .foreign("action_on_startup")
            .references("uuid")
            .inTable("startups");
    });
};

exports.down = function (knex) {
    return knex.schema.table("events", function (table) {
        // Drop the column if rolling back the migration
        table.dropColumn("action_on_startup");
    });
};

exports.up = function (knex) {
    return knex.schema.table("incubators", function (table) {
        // Add a new column 'highlighted_startups' that stores an array of UUIDs
        table.specificType("highlighted_startups", "uuid[]");
    });
};

exports.down = function (knex) {
    return knex.schema.table("incubators", function (table) {
        // Drop the column if rolling back the migration
        table.dropColumn("highlighted_startups");
    });
};

exports.up = function (knex) {
    return knex.schema.table("service_accounts", function (table) {
        table.string("status", "ACCOUNT_FOUND");
        table.string("email");
        table.string("service_user_id").nullable().alter();
        table.dropUnique(["account_type", "service_user_id"]);
        table.unique(["account_type", "service_user_id", "email"]);
    });
};

exports.down = function (knex) {
    return knex.schema.table("service_accounts", function (table) {
        // Drop the column if rolling back the migration
        table.dropUnique(["account_type", "service_user_id", "email"]);
        table.dropColumn("status");
        table.dropColumn("email");
        table.unique(["account_type", "service_user_id"]);
        table.string("service_user_id").notNullable().alter();
    });
};

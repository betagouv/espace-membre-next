exports.up = function (knex) {
    return knex.schema.alterTable("users", function (table) {
        table.string("primary_email_status").defaultTo("EMAIL_UNSET").alter();
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("users", function (table) {
        table.string("primary_email_status").defaultTo("EMAIL_ACTIVE").alter();
    });
};

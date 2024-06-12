exports.up = function (knex) {
    knex.schema.alterTable("startup_events", function (table) {
        table.uuid("uuid").defaultTo(knex.raw("uuid_generate_v4()")).alter();
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("startup_events", function (table) {
        table.uuid("uuid").alter();
    });
};

exports.up = function (knex) {
    return knex.schema.dropTable("newsletters");
};

exports.down = function (knex) {
    return knex.schema.createTable("newsletters", function (table) {
        table.uuid("id").defaultTo(knex.raw("gen_random_uuid()")).primary();
        table.string("url").notNullable();
        table.string("brevo_url").nullable();
        table.string("validator").nullable();
        table.string("year_week").nullable();
        table.datetime("publish_at").nullable();
        table.datetime("sent_at").nullable();
        table.timestamps(true, true);
    });
};

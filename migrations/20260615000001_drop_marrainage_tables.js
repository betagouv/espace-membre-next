export async function up(knex) {
    await knex.schema.dropTableIfExists("marrainage_groups_members");
    await knex.schema.dropTableIfExists("marrainage_groups");
    await knex.schema.dropTableIfExists("marrainage");
}

export async function down(knex) {
    await knex.schema.createTable("marrainage", (table) => {
        table.text("username").primary();
        table.text("last_onboarder").notNullable();
        table.integer("count").notNullable().defaultTo(1);
        table.boolean("completed").notNullable().defaultTo(false);
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
        table.datetime("last_updated").notNullable().defaultTo(knex.fn.now());
    });

    await knex.schema.createTable("marrainage_groups", (table) => {
        table.increments("id");
        table.string("onboarder");
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.string("status").defaultTo("PENDING");
        table.integer("count").notNullable().defaultTo(0);
    });

    await knex.schema.createTable("marrainage_groups_members", (table) => {
        table
            .bigInteger("marrainage_group_id")
            .unsigned()
            .index()
            .references("id")
            .inTable("marrainage_groups");
        table
            .string("username")
            .index()
            .references("username")
            .inTable("users");
        table.primary(["marrainage_group_id", "username"]);
    });
}

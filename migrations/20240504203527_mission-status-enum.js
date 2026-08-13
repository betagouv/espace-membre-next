export async function up(knex) {
    return knex.schema.table("missions", function (table) {
        table
            .enu("status", ["independent", "admin", "service"], {
                useNative: true,
                enumName: "missions_status_enum",
            })
            .alter();
    });
}

export async function down(knex) {
    await knex.raw("DROP IF EXIST TYPE missions_status_enum");
    return knex.schema.table("missions", function (table) {
        table.string("status").alter();
    });
}

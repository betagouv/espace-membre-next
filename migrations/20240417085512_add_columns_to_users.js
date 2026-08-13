exports.up = function(knex) {
    return knex.schema.alterTable("users", (table) => {
        table.string("fullname");
        table.string("role");
        table.string("github").nullable();
        table.text("bio").nullable();
        table.string("memberType").nullable();
        table.text("avatar").nullable();
        table.text("link").nullable();
    });
}

exports.down = function(knex) {
    return knex.schema.alterTable("users", (table) => {
        table.dropColumn("fullname");
        table.dropColumn("role");
        table.dropColumn("github");
        table.dropColumn("bio");
        table.dropColumn("memberType");
        table.dropColumn("avatar");
        table.dropColumn("link");
    });
}

exports.up = function (knex) {
    return knex.schema.alterTable("startups", function (table) {
        table.boolean("dsfr_required").defaultTo(true);
        table.boolean("dsfr_implemented").defaultTo(false);
        table.string("tech_audit_url").nullable();
        table.string("ecodesign_url").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("startups", function (table) {
        table.dropColumn("dsfr_required");
        table.dropColumn("dsfr_implemented");
        table.dropColumn("tech_audit_url");
        table.dropColumn("ecodesign_url");
    });
};

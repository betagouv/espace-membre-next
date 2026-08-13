exports.up = function (knex) {
    return knex.schema.alterTable("startups", function (table) {
        table.string("dsfr_status").nullable();
        table.string("tech_audit_url").nullable();
        table.string("ecodesign_url").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("startups", function (table) {
        table.dropColumn("dsfr_status");
        table.dropColumn("tech_audit_url");
        table.dropColumn("ecodesign_url");
    });
};

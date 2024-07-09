exports.up = function (knex) {
    return knex.schema.createTable("startups_files", (table) => {
        table
            .text("uuid")
            .primary()
            .notNullable()
            .defaultTo(knex.raw("uuid_generate_v4()"));
        table.text("filename").comment("Nom du fichier");
        table.integer("size").comment("Taille du fichier en octets");
        table.text("title").comment("Titre du fichier");
        table.text("comments");
        table.text("type").comment("Type de document");
        table.jsonb("data");
        table.uuid("startup_id").notNullable();
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
        table
            .foreign("startup_id")
            .references("uuid")
            .inTable("startups")
            .onDelete("CASCADE");
        table.binary("base64").comment("Contenu du fichier");
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("startups_files", function (table) {
        // plop
    });
};

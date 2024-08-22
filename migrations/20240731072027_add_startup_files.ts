exports.up = function (knex) {
    return knex.schema.createTable("startups_files", (table) => {
        table
            .text("uuid")
            .primary()
            .notNullable()
            .defaultTo(knex.raw("uuid_generate_v4()"));
        table.text("filename").comment("Nom du document");
        table.integer("size").comment("Taille du document en octets");
        table.text("title").comment("Titre du document");
        table.text("comments");
        table.text("type").comment("Type de document");
        table.jsonb("data").comment("Metadonnées du document");
        table.uuid("startup_id").notNullable();
        table
            .uuid("created_by")
            .notNullable()
            .comment("User qui a déposé le document");
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
        table.uuid("deleted_by").comment("User qui a détruit le document");
        table.datetime("deleted_at");
        table
            .foreign("startup_id")
            .references("uuid")
            .inTable("startups")
            .onDelete("CASCADE");
        table.binary("base64").comment("Contenu base64 du document");
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("startups_files", function (table) {
        // plop
    });
};

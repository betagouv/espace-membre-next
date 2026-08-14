exports.up = function (knex) {
    return knex.schema.alterTable("startups", function (table) {
        table.string("github");
        table.text("dashlord_url");
        table.text("website"); // 'any' suggests flexibility, using text to accommodate large data
        table.string("accessibility_status").nullable(); // Optional field, stored as JSONB for better indexing
        table.text("analyse_risques_url").nullable();
        table.boolean("analyse_risques").nullable();
        table.boolean("stats").nullable();
        table.text("content_url_encoded_markdown"); // Markdown content might be long, using text
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("startups", function (table) {
        table.dropColumns(
            "github",
            "dashlord_url",
            "website",
            "accessibility_status",
            "analyse_risques_url",
            "analyse_risques",
            "stats",
            "content_url_encoded_markdown"
        );
    });
};

exports.up = function (knex) {
    return knex.schema.table("missions", function (table) {
        // Add a UUID column to store the foreign key reference to the users table
        table
            .uuid("user_id")
            .references("uuid")
            .inTable("users")
            .onDelete("CASCADE")
            .onUpdate("CASCADE");
    });
};

exports.down = function (knex) {
    return knex.schema.table("missions", function (table) {
        // Remove the foreign key and the column if rolling back
        table.dropColumn("user_id");
    });
};

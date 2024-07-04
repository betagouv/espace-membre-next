exports.up = function (knex) {
    return knex.schema
        .table("missions", function (table) {
            // 1. Drop the existing primary key constraint
            table.dropPrimary();
        })
        .then(function () {
            return knex.schema.table("missions", function (table) {
                // 2. Add a UUID column if not exists
                table
                    .uuid("uuid")
                    .notNullable()
                    .defaultTo(knex.raw("uuid_generate_v4()"));
            });
        })
        .then(function () {
            return knex.schema.table("missions", function (table) {
                // 3. Set the UUID column as the new primary key
                table.primary("uuid");
            });
        });
};

exports.down = function (knex) {
    return knex.schema
        .table("missions", function (table) {
            // 1. Remove the primary key from 'uuid'
            table.dropPrimary();
        })
        .then(function () {
            return knex.schema.table("missions", function (table) {
                // 2. Drop the UUID column
                table.dropColumn("uuid");
            });
        })
        .then(function () {
            return knex.schema.table("missions", function (table) {
                // 3. Restore the primary key on 'id'
                table.primary("id");
            });
        });
};

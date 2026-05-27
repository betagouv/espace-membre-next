export async function up(knex) {
  await knex.schema.createTable("matrix_accounts", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("uuid")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("matrix_id").notNullable();
    table.timestamps(true, true);
    table.unique(["user_id"]);
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists("matrix_accounts");
}

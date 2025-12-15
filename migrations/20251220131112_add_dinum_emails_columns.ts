export async function up(knex) {
  return knex.schema.table("dinum_emails", function (table) {
    table.string("destination");
    table.string("type");
  });
}

export async function down(knex) {
  return knex.schema.table("dinum_emails", function (table) {
    table.dropColumn("destination");
    table.dropColumn("type");
  });
}

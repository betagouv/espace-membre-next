import { Knex } from "knex";

export async function up(knex: Knex) {
  return knex.schema.table("dinum_emails", function (table) {
    table.string("destination");
    table.string("type");
    table.uuid("user_id").nullable();
  });
}

export async function down(knex) {
  return knex.schema.table("dinum_emails", function (table) {
    table.dropColumn("destination");
    table.dropColumn("type");
  });
}

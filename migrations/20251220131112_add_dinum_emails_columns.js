exports.up = function(knex) {
  return knex.schema.table("dinum_emails", function (table) {
    table.string("destination");
    table.string("type");
    table.uuid("user_id").nullable();
  });
}

exports.down = function(knex) {
  return knex.schema.table("dinum_emails", function (table) {
    table.dropColumn("destination");
    table.dropColumn("type");
    table.dropColumn("user_id");
  });
}

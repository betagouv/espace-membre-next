exports.up = function (knex) {
  return knex.schema.table("users", (table) => {
    table.dropColumn("tjm");
  });
};

exports.down = function (knex) {
  return knex.schema.table("users", (table) => {
    table.integer("tjm");
  });
};

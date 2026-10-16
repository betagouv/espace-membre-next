exports.up = async function (knex) {
  await knex.schema.alterTable("dinum_emails", (table) => {
    table.text("user_id_locked_by").nullable();
    table.timestamp("user_id_locked_at", { useTz: true }).nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("dinum_emails", (table) => {
    table.dropColumn("user_id_locked_by");
    table.dropColumn("user_id_locked_at");
  });
};

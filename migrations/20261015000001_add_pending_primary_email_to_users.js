exports.up = async function (knex) {
  await knex.schema.alterTable("users", (table) => {
    table.text("pending_primary_email").nullable();
    table
      .timestamp("pending_primary_email_expires_at", { useTz: true })
      .nullable();
    table.text("pending_primary_email_requested_by").nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("pending_primary_email");
    table.dropColumn("pending_primary_email_expires_at");
    table.dropColumn("pending_primary_email_requested_by");
  });
};

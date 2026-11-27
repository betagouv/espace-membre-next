// Un item de checklist peut être déclaré « non concerné » avec un motif (et un
// commentaire libre) au lieu d'être coché comme fait. La ligne user_events
// existe dans les deux cas, ce qui la fait compter dans la progression : seul
// le motif distingue « non concerné » de « fait ».
exports.up = async function (knex) {
  await knex.schema.alterTable("user_events", (table) => {
    table.text("not_concerned_reason").nullable();
    table.text("not_concerned_comment").nullable();
  });
  // Pas de commentaire sans motif : un commentaire orphelin ne serait affiché
  // nulle part.
  await knex.raw(`
    ALTER TABLE user_events
    ADD CONSTRAINT user_events_not_concerned_comment_needs_reason
    CHECK (not_concerned_comment IS NULL OR not_concerned_reason IS NOT NULL)
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE user_events
    DROP CONSTRAINT IF EXISTS user_events_not_concerned_comment_needs_reason
  `);
  await knex.schema.alterTable("user_events", (table) => {
    table.dropColumn("not_concerned_reason");
    table.dropColumn("not_concerned_comment");
  });
};

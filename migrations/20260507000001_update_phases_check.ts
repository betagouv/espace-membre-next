exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE phases DROP CONSTRAINT IF EXISTS chk_phase_name;
    ALTER TABLE phases ADD CONSTRAINT chk_phase_name
    CHECK (name IN ('investigation', 'construction', 'acceleration', 'perennisation', 'abandon','abandon-investigation', 'transfere', 'opere'));
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE phases DROP CONSTRAINT IF EXISTS chk_phase_name;
    ALTER TABLE phases ADD CONSTRAINT chk_phase_name
    CHECK (name IN ('investigation', 'construction', 'acceleration', 'perennisation', 'transfer', 'success', 'alumni', 'abandon', 'abandon-investigation', 'transfere', 'opere'));
  `);
};

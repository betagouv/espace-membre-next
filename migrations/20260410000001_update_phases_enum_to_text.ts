exports.up = async function (knex) {
  // change the column type to text with a constraint
  await knex.raw(`
    ALTER TABLE phases ALTER COLUMN name TYPE text;
    DROP TYPE IF EXISTS startups_phase_enum;
    ALTER TABLE phases ADD CONSTRAINT chk_phase_name
    CHECK (name IN ('investigation', 'construction', 'acceleration', 'perennisation', 'transfer', 'success', 'alumni', 'abandon',  'transfere', 'opere'));
  `);

  // todo: after data fix
  // await knex.raw(`
  //   ALTER TABLE phases ADD CONSTRAINT chk_phase_name
  //   CHECK (name IN ('investigation', 'construction', 'acceleration', 'perennisation', 'abandon', 'transfere', 'opere'));
  // `);
};

exports.down = async function (knex) {
  const OLD_ENUM_VALUES = [
    "investigation",
    "construction",
    "acceleration",
    "transfer",
    "success",
    "alumni",
  ];

  // 1. Re-create the old enum type
  await knex.raw(`
        DROP TYPE IF EXISTS startups_phase_enum;
    `);
  await knex.raw(`
        CREATE TYPE startups_phase_enum AS ENUM (${OLD_ENUM_VALUES.map((v) => `'${v}'`).join(", ")});
    `);

  // 2. Cast column back to old enum (values not in old enum will cause an error)
  await knex.raw(`
        ALTER TABLE phases
        ALTER COLUMN name TYPE startups_phase_enum
        USING name::startups_phase_enum;
    `);
};

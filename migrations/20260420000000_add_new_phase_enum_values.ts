exports.up = function (knex) {
    return knex.schema.raw(`
      ALTER TYPE "startups_phase_enum" ADD VALUE 'perennisation';
      ALTER TYPE "startups_phase_enum" ADD VALUE 'abandon-investigation';
      ALTER TYPE "startups_phase_enum" ADD VALUE 'abandon';
      ALTER TYPE "startups_phase_enum" ADD VALUE 'transfere';
      ALTER TYPE "startups_phase_enum" ADD VALUE 'opere';
    `);
};

exports.down = function (knex) {
    return knex.schema.raw(`
      DELETE FROM pg_enum
      WHERE enumlabel IN ('perennisation', 'abandon-investigation', 'abandon', 'transfere', 'opere')
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'startups_phase_enum'
      );
    `);
};

exports.up = function (knex) {
    return knex.schema.raw(`
      ALTER TYPE "users_domaine_enum" ADD VALUE 'Support';
      ALTER TYPE "users_domaine_enum" ADD VALUE 'Attributaire';
    `);
};

exports.down = function (knex) {
    return knex.schema.raw(`
      DELETE FROM pg_enum
      WHERE enumlabel IN ('Support', 'Attributaire')
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'users_domaine_enum'
      );
    `);
};

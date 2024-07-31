export async function up(knex) {
    return knex.schema
        .alterTable(
            knex.raw(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `)
        )
        .then(() =>
            knex.raw(`
        CREATE TRIGGER update_teams_updated_at
        BEFORE UPDATE ON teams
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
      `)
        )
        .then(() =>
            knex.raw(`
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
      `)
        );
}

export async function down(knex) {
    return knex.schema
        .alterTable(
            knex.raw(`
        DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
      `)
        )
        .then(() =>
            knex.raw(`
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      `)
        )
        .then(() =>
            knex.raw(`
        DROP FUNCTION IF EXISTS update_updated_at_column();
      `)
        );
}

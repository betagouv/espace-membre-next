import { config } from "dotenv";
config();

export default {
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  migrations: {
    tableName: 'knex_migrations',
    directory: './src/migrations',

  },
  seeds: {
    extension: 'ts',
    directory: './src/tests/seed',
  },
};

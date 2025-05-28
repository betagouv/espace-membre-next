import { config } from "dotenv";
config();

export default {
  client: "postgresql",
  connection: process.env.DATABASE_URL,
  migrations: {
    tableName: "knex_migrations",
    directory: "./migrations",
  },
  seeds: {
    extension: "ts",
    directory: "./__tests__/seed",
  },
};

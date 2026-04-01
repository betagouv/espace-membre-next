import { config } from "dotenv";
import knex from "knex";

config();
export default knex({
  client: "pg",
  connection: process.env.DATABASE_URL,
});

// Use this file to override environment variables for test.

import dotenv from "dotenv";
import { parse } from "pg-connection-string";

dotenv.config();

if (process.env.DATABASE_URL) {
    const config = parse(process.env.DATABASE_URL);
    const testDbName = `${config.database as string}__test`;
    console.log(
        `Overriding DATABASE_URL for test with database : ${testDbName}`
    );
    process.env.DATABASE_URL = `postgres://${encodeURIComponent(
        config.user as string
    )}:${encodeURIComponent(config.password as string)}@${encodeURIComponent(
        config.host as string
    )}:${encodeURIComponent(config.port as string)}/${encodeURIComponent(
        testDbName
    )}`;
} else {
    console.log("Environment variable DATABASE_URL not found");
}

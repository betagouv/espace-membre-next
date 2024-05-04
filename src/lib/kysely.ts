import { config } from "dotenv";
import {
    Kysely,
    PostgresDialect,
    sql,
    Expression,
    RawBuilder,
    Simplify,
} from "kysely";
import { Pool } from "pg";

import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`

config();

const dialect = new PostgresDialect({
    pool: new Pool({
        connectionString: process.env.DATABASE_URL,
    }),
});

export { sql } from "kysely";

export function jsonArrayFrom<O>(
    expr: Expression<O>
): RawBuilder<Simplify<O>[]> {
    return sql`(select coalesce(json_agg(agg), '[]') from ${expr} as agg)`;
}

export function jsonObjectFrom<O>(
    expr: Expression<O>
): RawBuilder<Simplify<O>> {
    return sql`(select to_json(obj) from ${expr} as obj)`;
}

export const db = new Kysely<DB>({
    dialect,
});

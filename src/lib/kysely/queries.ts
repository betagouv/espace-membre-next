import { sql, ExpressionBuilder } from "kysely";

import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db, jsonArrayFrom } from "@/lib/kysely";

/** Return all startups */
export function getAllStartups() {
  return db.selectFrom("startups").selectAll().execute();
}

/** Return all startups */
export async function getStartup(params: { ghid: string } | { uuid: string }) {
  let query = db.selectFrom("startups").selectAll();

  if ("ghid" in params) {
    query = query.where("startups.ghid", "=", params.ghid);
  } else {
    query = query.where("startups.uuid", "=", params.uuid);
  }
  const startups = await db.executeQuery(query);

  return (startups.rows.length && startups.rows[0]) || undefined;
}


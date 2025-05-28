import * as Sentry from "@sentry/node";
import Airtable from "airtable";

import { db } from "@/lib/kysely";
import { Formation } from "@/models/formation";
import config from "@/server/config";

export const syncFormationInscriptionFromAirtable = async (
  syncOnlyNewRecord,
) => {
  var base = new Airtable({ apiKey: config.AIRTABLE_API_KEY }).base(
    config.AIRTABLE_FORMATION_BASE_ID!,
  );
  var date = new Date();
  date.setDate(date.getDate() - 19);
  const dateStr = date.toISOString().split("T")[0];
  let filterByFormula =
    `DATETIME_DIFF(DATETIME_PARSE(` +
    dateStr +
    `, 'YYYY-MM-DD'),{Created}, 'days')<0`;
  await base
    .table("Inscriptions")
    .select({
      filterByFormula,
      view: "Inscrits",
      fields: ["Email", "Record ID (from Formation)"],
    })
    .eachPage(
      async function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        for (const record of records) {
          try {
            const username = (record.get("Email") || "") as string;
            const formation_record_id = record.get(
              "Record ID (from Formation)",
            ) as [string];
            if (formation_record_id) {
              const formation = await db
                .selectFrom("formations")
                .selectAll()
                .where("airtable_id", "=", formation_record_id[0])
                .executeTakeFirst();
              if (formation && username) {
                await db
                  .insertInto("users_formations")
                  .values({
                    formation_id: formation.id,
                    username: username.split("@")[0],
                  })
                  .returningAll()
                  .executeTakeFirst();
              }
            }
          } catch (e) {
            Sentry.captureException(e);
            console.error(e);
          }
        }
        try {
          fetchNextPage();
        } catch (e) {
          console.log("no next page");
        }
      },
      function done(err) {
        if (err) {
          console.error(err);
          return;
        }
      },
    );
};

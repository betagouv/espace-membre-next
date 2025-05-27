import pAll from "p-all";

import { importFromZip, MarkdownData } from "./utils";
import { db } from "@lib/kysely";

const insertData = async (markdownData: MarkdownData) => {
  // insert teams
  const teams = await db
    .insertInto("teams")
    .values(({ selectFrom }) =>
      markdownData.teams.map((team) => ({
        ghid: team.attributes.ghid,
        incubator_id: (team.attributes.incubator &&
          selectFrom("incubators")
            .where(
              "ghid",
              "=",
              team.attributes.incubator.replace("/incubators/", ""),
            )
            .select("uuid"))!,
        mission: team.attributes.mission!,
        name: team.attributes.name,
      })),
    )
    .returning(["uuid", "ghid"])
    .execute();

  // insert users
  const authors = await pAll(
    markdownData.authors.map((author) => async () => {
      const query = db
        .selectFrom("users")
        .where("username", "=", author.attributes.ghid)
        .selectAll();

      const userId = await query.executeTakeFirstOrThrow();

      // missions
      await pAll(
        author.attributes.teams?.map((team) => async () => {
          const res = await db
            .selectFrom("teams")
            .where("ghid", "=", team.replace("/teams/", ""))
            .select("uuid")
            .executeTakeFirst();
          if (res) {
            return db
              .insertInto("users_teams")
              .values({
                team_id: res.uuid,
                user_id: userId.uuid,
              })
              .execute();
          }
        }) || [],
        { concurrency: 1 },
      );

      return userId;
    }),
    { concurrency: 1 },
  );

  console.log("\n\n");
  console.table({
    teams: teams.length,
  });
};

const importData = async () => {
  const markdownData = await importFromZip();
  await insertData(markdownData);
};

importData();

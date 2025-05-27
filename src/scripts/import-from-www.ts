import fm from "front-matter";
import pAll from "p-all";
import unzipper, { Entry } from "unzipper";
import { ZodSchema, z } from "zod";

import {
  startup,
  author,
  organisation,
  incubator,
  team,
} from "./github-schemas";
import { importFromZip, MarkdownData } from "./utils";
import config from "@/server/config";
import { db } from "@lib/kysely";

const { Readable } = require("stream");

const insertData = async (markdownData: MarkdownData) => {
  // truncate tables
  // do not drop users -- await db.deleteFrom("users").execute();
  await db.deleteFrom("missions_startups").execute();
  await db.deleteFrom("missions").execute();
  await db.deleteFrom("phases").execute();
  await db.deleteFrom("startups_organizations").execute();
  await db.deleteFrom("startup_events").execute();
  await db.deleteFrom("events").execute();
  await db.deleteFrom("startups").execute();
  await db.deleteFrom("incubators").execute();
  await db.deleteFrom("organizations").execute();
  await db.deleteFrom("teams").execute();

  // insert organisations
  const organisations = await db
    .insertInto("organizations")
    .values(
      markdownData.organisations.map((orga) => ({
        domaine_ministeriel: orga.attributes.domaine_ministeriel || "",
        name: orga.attributes.name,
        acronym: orga.attributes.acronym,
        type: orga.attributes.type,
        ghid: orga.attributes.ghid,
      })),
    )
    .returning(["uuid", "ghid"])
    .execute();

  // insert incubators
  const incubators = await db
    .insertInto("incubators")
    .values(({ selectFrom }) =>
      markdownData.incubators
        // .filter((incub) => {
        //     if (!incub.attributes.owner) {
        //         console.error(
        //             `IncubatorError: invalid owner for ${incub.attributes.ghid}`
        //         );
        //         return false;
        //     }
        //     return true;
        // })
        .map((incub) => ({
          title: incub.attributes.title,
          address: incub.attributes.address,
          contact: incub.attributes.contact,
          github: incub.attributes.github,
          owner_id:
            (incub.attributes.owner &&
              selectFrom("organizations")
                .where(
                  "ghid",
                  "=",
                  incub.attributes.owner.replace("/organisations/", ""),
                )
                .select("uuid")) ||
            null,
          website: incub.attributes.website,
          ghid: incub.attributes.ghid,
          description: incub.body,
          short_description: incub.attributes.short_description,
        })),
    )
    .returning(["uuid", "ghid"])
    .execute();

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
  // insert startups
  const startups = await pAll(
    markdownData.startups.map((startup) => async () => {
      const incubator_id = incubators.find(
        (o) => o.ghid === startup.attributes.incubator,
      )?.uuid;
      const query = db
        .insertInto("startups")
        .values({
          name: startup.attributes.title || startup.attributes.ghid,
          contact: startup.attributes.contact,
          incubator_id,
          link: startup.attributes.link,
          repository: startup.attributes.repository,
          accessibility_status: startup.attributes.accessibility_status,
          analyse_risques: startup.attributes.analyse_risques,
          analyse_risques_url: startup.attributes.analyse_risques_url,
          budget_url: startup.attributes.budget_url,
          dashlord_url: startup.attributes.dashlord_url,
          mon_service_securise: startup.attributes.mon_service_securise,
          pitch: startup.attributes.mission,
          stats: startup.attributes.stats,
          stats_url: startup.attributes.stats_url,
          thematiques: JSON.stringify(startup.attributes.thematiques),
          usertypes: JSON.stringify(startup.attributes.usertypes),
          techno: JSON.stringify(startup.attributes.techno),
          description: startup.body,
          ghid: startup.attributes.ghid,
        })
        .returning(["uuid", "ghid"]);

      const startupDb = await query.executeTakeFirstOrThrow();

      // phases
      const phaseNames = startup.attributes.phases?.map((p) => p.name) || [];
      if (phaseNames.length !== Array.from(new Set(phaseNames)).length) {
        console.error(
          `PhaseError: Duplicate phases in https://github.com/betagouv/beta.gouv.fr/blob/master/content/_startups/${startup.attributes.ghid}.md`,
        );
      }

      // phases
      await pAll(
        startup.attributes.phases?.map((phase) => () => {
          let end: Date | undefined = phase.end || undefined;
          if (phase.end && phase.start >= phase.end) {
            console.error(
              `PhaseError: start>end in https://github.com/betagouv/beta.gouv.fr/blob/master/content/_startups/${startup.attributes.ghid}.md`,
            );
            end = undefined;
          }

          return (
            db
              .insertInto("phases")
              .values({
                //@ts-ignore todo
                name: phase.name,
                start: phase.start || new Date(),
                end,
                comment: phase.comment,
                startup_id: startupDb.uuid,
              })
              // .onConflict((oc) => {
              //     return oc.doNothing();
              // })
              .execute()
          );
        }) || [],
        { concurrency: 1 },
      );

      if (startup.attributes.sponsors && startup.attributes.sponsors.length) {
        await db
          .insertInto("startups_organizations")
          .values(
            ({ selectFrom }) =>
              startup.attributes.sponsors?.map((sponsor) => ({
                organization_id: selectFrom("organizations")
                  .where("ghid", "=", sponsor.replace("/organisations/", ""))
                  .select("uuid"),
                startup_id: startupDb.uuid,
              })) || [],
          )
          .execute();
      }

      // events
      if (startup.attributes.events && startup.attributes.events.length) {
        await db
          .insertInto("startup_events")
          .values(
            startup.attributes.events?.map((event) => ({
              name: event.name,
              date: event.date,
              comment: event.comment,
              startup_id: startupDb.uuid,
            })) || [],
          )
          .execute();
      }

      if (startup.attributes.fast) {
        await db
          .insertInto("startup_events")
          .values({
            name: "fast",
            date: `2024-01-01`,
            comment: `Montant de ${startup.attributes.fast?.montant}€ pour la promotion ${startup.attributes.fast?.promotion}`,
            startup_id: startupDb.uuid,
          })
          .execute();
      }

      return startupDb;
    }),
    { concurrency: 1 },
  );

  // insert users
  const authors = await pAll(
    markdownData.authors.map((author) => async () => {
      const query = db
        .insertInto("users")
        .values({
          fullname: author.attributes.fullname,
          link: author.attributes.link,
          domaine: author.attributes.domaine,
          avatar: author.attributes.avatar,
          github: author.attributes.github,
          role: author.attributes.role,
          username: author.attributes.ghid,
          competences: JSON.stringify(author.attributes.competences),
          bio: author.body,
          primary_email: `${author.attributes.ghid}@${config.domain}`,
        })
        .onConflict((oc) => {
          // update on username conflict
          return oc.column("username").doUpdateSet({
            fullname: author.attributes.fullname,
            link: author.attributes.link,
            domaine: author.attributes.domaine,
            avatar: author.attributes.avatar,
            github: author.attributes.github,
            role: author.attributes.role,
            competences: JSON.stringify(author.attributes.competences),
            bio: author.body,
          });
        })
        .returning(["uuid", "username"]);

      const userId = await query.executeTakeFirstOrThrow();

      // missions
      await pAll(
        author.attributes.missions?.map((mission) => async () => {
          let end: Date | undefined = mission.end;
          if (mission.end && mission.start >= mission.end) {
            console.error(
              `MissionError: end>start in https://github.com/betagouv/beta.gouv.fr/blob/master/content/_authors/${author.attributes.ghid}.md`,
            );
            end = undefined;
          }
          const mission_id = (
            await db
              .insertInto("missions")
              .values({
                start: mission.start || new Date(),
                end,
                user_id: userId.uuid,
                employer: mission.employer,
                //@ts-ignore todo
                status: mission.status,
              })
              .returning("uuid")
              .executeTakeFirstOrThrow()
          ).uuid;

          return (
            mission.startups &&
            mission.startups.length &&
            db
              .insertInto("missions_startups")
              .values(
                ({ selectFrom }) =>
                  mission.startups?.map((startup) => ({
                    startup_id: selectFrom("startups")
                      .where("ghid", "=", startup)
                      .select("uuid"),
                    mission_id,
                  })) || [],
              )
              .execute()
          );
        }) || [],
        { concurrency: 1 },
      );
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
    organisations: organisations.length,
    incubators: incubators.length,
    startups: startups.length,
    authors: authors.length,
  });
};

const importData = async () => {
  const markdownData = await importFromZip();
  await insertData(markdownData);
};

importData();

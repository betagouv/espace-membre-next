const { Readable } = require("stream");
import fm from "front-matter";
import unzipper, { Entry } from "unzipper";
import { db } from "@lib/kysely";
import { startup, author, organisation, incubator } from "./github-schemas";
import { ZodSchema, z } from "zod";
import pAll from "p-all";
import { importFromZip } from "./utils";

const insertData = async (markdownData) => {
    // truncate tables
    // do not drop users -- await db.deleteFrom("users").execute();
    await db.deleteFrom("missions_startups").execute();
    await db.deleteFrom("missions").execute();
    await db.deleteFrom("phases").execute();
    await db.deleteFrom("startups_organizations").execute();
    await db.deleteFrom("startups").execute();
    await db.deleteFrom("incubators").execute();
    await db.deleteFrom("organizations").execute();

    // insert organisations
    const organisations = await pAll(
        [
            // () =>
            //     db
            //         .insertInto("organizations")
            //         .values({
            //             name: "test",
            //             ghid: "test",
            //             type: "autre",
            //             domaine_ministeriel: "",
            //         })
            //         .returning(["uuid", "ghid"])
            //         .executeTakeFirstOrThrow(),
            ...markdownData.organisations.map((orga) => async () => {
                const query = db
                    .insertInto("organizations")
                    .values({
                        domaine_ministeriel:
                            orga.attributes.domaine_ministeriel || "",
                        name: orga.attributes.name,
                        acronym: orga.attributes.acronym,
                        type: orga.attributes.type,
                        ghid: orga.attributes.ghid,
                    })
                    .returning(["uuid", "ghid"]);
                return query.executeTakeFirstOrThrow();
            }),
        ],
        { concurrency: 1 }
    );

    // insert incubators
    const incubators = await pAll(
        markdownData.incubators.map((incub) => async () => {
            const owner_id = organisations.find(
                (o) =>
                    o.ghid ===
                    (incub.attributes.owner &&
                        incub.attributes.owner.replace("/organisations/", ""))
            )?.uuid;
            const query = db
                .insertInto("incubators")
                .values({
                    title: incub.attributes.title,
                    address: incub.attributes.address,
                    contact: incub.attributes.contact,
                    github: incub.attributes.github,
                    owner_id,
                    website: incub.attributes.website,
                    ghid: incub.attributes.ghid,
                })
                .returning(["uuid", "ghid"]);
            return query.executeTakeFirstOrThrow();
        }),
        { concurrency: 1 }
    );

    // insert startups
    const startups = await pAll(
        markdownData.startups.map((startup) => async () => {
            const incubator_id = incubators.find(
                (o) => o.ghid === startup.attributes.incubator
            )?.uuid;
            const query = db
                .insertInto("startups")
                .values({
                    name: startup.attributes.title,
                    contact: startup.attributes.contact,
                    incubator_id,
                    link: startup.attributes.link,
                    website: startup.attributes.link, // ??
                    repository: startup.attributes.repository,
                    github: startup.attributes.repository, // ??
                    accessibility_status:
                        startup.attributes.accessibility_status,
                    analyse_risques: startup.attributes.analyse_risques,
                    analyse_risques_url: startup.attributes.analyse_risques_url,
                    budget_url: startup.attributes.budget_url,
                    dashlord_url: startup.attributes.dashlord_url,
                    mon_service_securise:
                        startup.attributes.mon_service_securise,
                    pitch: startup.attributes.mission,
                    stats: startup.attributes.stats,
                    stats_url: startup.attributes.stats_url,
                    thematiques: JSON.stringify(startup.attributes.thematiques),
                    usertypes: JSON.stringify(startup.attributes.usertypes),
                    techno: JSON.stringify(startup.attributes.techno),
                    description: startup.body,
                    id: startup.attributes.ghid,
                })
                .returning(["uuid", "id"]);

            const startupDb = await query.executeTakeFirstOrThrow();
            // phases
            const phaseNames =
                startup.attributes.phases?.map((p) => p.name) || [];
            if (phaseNames.length !== Array.from(new Set(phaseNames)).length) {
                console.error(
                    `PhaseError: Duplicate phases in https://github.com/betagouv/beta.gouv.fr/blob/master/content/_startups/${startup.attributes.ghid}.md`
                );
            }

            // phases
            await pAll(
                startup.attributes.phases?.map((phase) => () => {
                    let end: Date | undefined = phase.end || undefined;
                    if (phase.end && phase.start >= phase.end) {
                        console.error(
                            `PhaseError: start>end in https://github.com/betagouv/beta.gouv.fr/blob/master/content/_startups/${startup.attributes.ghid}.md`
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
                { concurrency: 1 }
            );

            // sponsors
            await pAll(
                startup.attributes.sponsors?.map((sponsor) => () => {
                    let organization_id = sponsor.replace(
                        "/organisations/",
                        ""
                    );
                    // if (
                    //     sponsor === "/organisations/ofpra" ||
                    //     sponsor === "/organisations/csm" ||
                    //     sponsor === "/organisations/idfm"
                    // ) {
                    //     // todo: drop buggy files
                    //     console.error(
                    //         `SponsorError: unknown sponsor ${sponsor} in https://github.com/betagouv/beta.gouv.fr/blob/master/content/_startups/${startup.attributes.ghid}.md`
                    //     );
                    //     // organization_id = "test";
                    // }
                    return db
                        .insertInto("startups_organizations")
                        .values(({ selectFrom }) => ({
                            organization_id: selectFrom("organizations")
                                .where("ghid", "=", organization_id)
                                .select("uuid"),
                            startup_id: startupDb.uuid,
                        }))
                        .execute();
                }) || [],
                { concurrency: 1 }
            );

            // events
            // fast
            // todo
            return startupDb;
        }),
        { concurrency: 1 }
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
                    role: author.attributes.role,
                    username: author.attributes.ghid,
                    competences: JSON.stringify(author.attributes.competences),
                    bio: author.body,
                })
                .onConflict((oc) => {
                    // update on username conflict
                    return oc.column("username").doUpdateSet({
                        fullname: author.attributes.fullname,
                        link: author.attributes.link,
                        domaine: author.attributes.domaine,
                        avatar: author.attributes.avatar,
                        role: author.attributes.role,
                        competences: JSON.stringify(
                            author.attributes.competences
                        ),
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
                            `MissionError: end>start in https://github.com/betagouv/beta.gouv.fr/blob/master/content/_authors/${author.attributes.ghid}.md`
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
                                    mission.startups?.map((s) => ({
                                        startup_id: selectFrom("startups")
                                            .where("id", "=", s)
                                            .select("uuid"),
                                        mission_id,
                                    })) || []
                            )
                            .execute()
                    );
                }) || [],
                { concurrency: 1 }
            );

            return userId;
        }),
        { concurrency: 1 }
    );

    console.log("\n\n");
    console.table({
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

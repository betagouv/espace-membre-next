import { detailedDiff } from "deep-object-diff";
import { writeFile } from "fs/promises";
import yaml from "js-yaml";
import markdownit from "markdown-it";
import path from "path";

import {
    startup,
    author,
    organisation,
    incubator,
    team,
} from "./github-schemas";
import {
    withEvents,
    withPhases,
    withMissions,
    extractValidValues,
    dumpYaml,
    importFromZip,
} from "./utils";
import { db, sql } from "@lib/kysely";

const md = markdownit({ html: true });

const getChanges = async (markdownData) => {
    const updates: any[] = [];
    const organisations = await db
        .selectFrom("organizations")
        .select(["acronym", "domaine_ministeriel", "name", "type", "ghid"])
        .execute();
    const incubators = await db
        .selectFrom("incubators")
        .leftJoin("organizations", "organizations.uuid", "incubators.owner_id")
        .select((eb) => [
            "address",
            "contact",
            "description",
            "short_description",
            "github",
            "title",
            "website",
            "incubators.ghid",
            sql<string>`CASE WHEN organizations.ghid IS NOT NULL then concat('/organisations/', organizations.ghid) else NULL END`.as(
                "owner"
            ),
        ])
        .execute();
    const teams = await db
        .selectFrom("teams")
        .leftJoin("incubators", "incubators.uuid", "teams.incubator_id")
        .select((eb) => [
            "name",
            "mission",
            "teams.ghid",
            sql<string>`CASE WHEN incubators.ghid IS NOT NULL then concat('/incubators/', incubators.ghid) else NULL END`.as(
                "incubator"
            ),
        ])
        .execute();
    const startupColumns = [
        "startups.ghid",
        "startups.description",
        "startups.accessibility_status",
        "startups.analyse_risques",
        //"startups.analyse_risques_url",
        "startups.mon_service_securise",
        "startups.budget_url",
        "startups.contact",
        "startups.repository",
        "startups.link",
        "startups.stats",
        "startups.stats_url",
        "startups.dashlord_url",
        "startups.name",
        "startups.pitch",
        "startups.thematiques",
        "startups.usertypes",
        "startups.techno",
    ] as const;
    const startups = await db
        .selectFrom("startups")
        .leftJoin(
            "startups_organizations",
            "startups_organizations.startup_id",
            "startups.uuid"
        )
        .leftJoin(
            "organizations",
            "organizations.uuid",
            "startups_organizations.organization_id"
        )
        .leftJoin("incubators", "incubators.uuid", "startups.incubator_id")
        .select((eb) => [
            ...startupColumns,
            eb.ref("startups.name").as("title"),
            eb.ref("startups.pitch").as("mission"),
            eb.ref("incubators.ghid").as("incubator"),
            sql<
                Array<string>
            >`COALESCE(NULLIF(ARRAY_AGG(CONCAT('/organisations/', organizations.ghid) order by organizations.ghid), '{/organisations/}'), '{}')`.as(
                "sponsors"
            ),
            withPhases(eb),
            withEvents(eb),
        ])
        .groupBy([...startupColumns, "startups.uuid", "incubators.ghid"])
        .execute();

    const userColumns = [
        "users.uuid",
        "users.username",
        "users.fullname",
        "users.role",
        "users.domaine",
        "users.avatar",
        "users.github",
        "users.link",
        "users.competences",
        "users.bio",
    ] as const;
    const users = await db
        .selectFrom("users")
        .select((eb) => [...userColumns, withMissions(eb)])
        .groupBy([...userColumns, "users.uuid"])
        .execute();

    // update orgs
    organisations.forEach((dbOrga) => {
        const ghOrga = markdownData.organisations.find(
            (o) => o.attributes.ghid === dbOrga.ghid
        );
        const dbOrga2 = extractValidValues(dbOrga, ["ghid", "username"]);
        if (!ghOrga) {
            // create gh orga
            updates.push({
                file: `content/_organisations/${dbOrga.ghid}.md`,
                content: "---\n" + yaml.dump(dbOrga2) + "---\n",
            });
        } else {
            const { ghid: ghid2, ...ghOrga2 } = ghOrga.attributes;
            const diffed = detailedDiff(ghOrga2, dbOrga2);
            if (
                Object.keys(diffed.added).length ||
                Object.keys(diffed.updated).length
            ) {
                const updated = { ...ghOrga2, ...dbOrga2 };
                try {
                    organisation.parse(updated);
                } catch (e) {
                    console.error(`ERROR parsing organisation ${ghid2}`);
                    console.error(e);
                }
                updates.push({
                    file: `content/_organisations/${dbOrga.ghid}.md`,
                    content: dumpYaml(updated),
                });
            }
        }
    });

    // update incubateurs
    incubators.forEach((dbIncub) => {
        const ghIncub = markdownData.incubators.find(
            (o) => o.attributes.ghid === dbIncub.ghid
        );
        const dbIncub2 = extractValidValues(dbIncub, [
            "ghid",
            "description",
            "short_description",
        ]);
        const htmlShortDescription =
            (dbIncub.short_description &&
                md.renderInline(dbIncub.short_description)) ||
            "";
        if (!ghIncub) {
            // create gh orga
            updates.push({
                file: `content/_incubators/${dbIncub.ghid}.md`,
                content: dumpYaml(
                    {
                        ...dbIncub2,
                        short_description: htmlShortDescription,
                    },
                    dbIncub.description || ""
                ),
            });
        } else {
            // dont update null values from DB
            const { ghid: ghid2, ...ghIncub2 } = ghIncub.attributes;
            const diffed = detailedDiff(ghIncub2, {
                ...dbIncub2,
                short_description: htmlShortDescription,
            });
            if (
                Object.keys(diffed.updated).length ||
                Object.keys(diffed.added).length
            ) {
                const updated = {
                    ...ghIncub2,
                    ...dbIncub2,
                    short_description: htmlShortDescription,
                };
                updated.website = updated.website || ""; // wth due to url field ?
                updated.github = updated.github || ""; // wth due to url field ?
                updated.owner = updated.owner || ""; // wth
                updated.address = updated.address || ""; // wth
                updated.contact = updated.contact || ""; // wth
                try {
                    incubator.parse(updated);
                } catch (e) {
                    console.error(`ERROR parsing incubator ${ghid2}`);
                    console.error(e);
                }
                updates.push({
                    file: `content/_incubators/${dbIncub.ghid}.md`,
                    content: dumpYaml(updated, dbIncub.description || ""),
                });
            }
        }
    });

    // update teams
    teams.forEach((dbTeam) => {
        const ghTeam = markdownData.teams.find(
            (o) => o.attributes.ghid === dbTeam.ghid
        );
        const dbTeam2 = extractValidValues(dbTeam, ["ghid", "mission"]);
        const htmlMission =
            (dbTeam.mission && md.renderInline(dbTeam.mission)) || "";
        if (!ghTeam) {
            // create gh orga
            updates.push({
                file: `content/_teams/${dbTeam.ghid}.md`,
                content: dumpYaml(
                    {
                        ...dbTeam2,
                        mission: htmlMission,
                    },
                    ""
                ),
            });
        } else {
            // dont update null values from DB
            const { ghid: ghid2, ...ghTeam2 } = ghTeam.attributes;
            const diffed = detailedDiff(ghTeam2, {
                ...dbTeam2,
                short_description: htmlMission,
            });
            if (
                Object.keys(diffed.updated).length ||
                Object.keys(diffed.added).length
            ) {
                const updated = {
                    ...ghTeam2,
                    ...dbTeam2,
                    mission: htmlMission,
                };
                updated.name = updated.name || ""; // wth due to url field ?
                updated.incubator = updated.incubator || ""; // wth
                try {
                    team.parse(updated);
                } catch (e) {
                    console.error(`ERROR parsing team ${ghid2}`);
                    console.error(e);
                }
                updates.push({
                    file: `content/_teams/${dbTeam.ghid}.md`,
                    content: dumpYaml(updated, ""),
                });
            }
        }
    });

    // update startups
    startups.forEach((dbStartup) => {
        const ghStartup = markdownData.startups.find(
            (o) => o.attributes.ghid === dbStartup.ghid
        );

        const dbStartup2 = extractValidValues(dbStartup, [
            "ghid",
            "description",
            "name",
            "pitch",
        ]);
        if (!ghStartup) {
            // create gh startup
            updates.push({
                file: `content/_startups/${dbStartup.ghid}.md`,
                content: dumpYaml(dbStartup2, dbStartup.description || ""),
            });
        } else {
            const { ghid: ghid2, ...ghStartup2 } = ghStartup.attributes;
            const diffed = detailedDiff(ghStartup2, dbStartup2);
            if (
                Object.keys(diffed.updated).length ||
                Object.keys(diffed.added).length
            ) {
                if (
                    diffed.updated["sponsors"] &&
                    Object.keys(diffed.updated).length === 1
                ) {
                    // skip sponsors update if only order change
                    return;
                }
                if (
                    diffed.added["sponsors"] &&
                    Object.keys(diffed.added).length === 1 &&
                    diffed.added["sponsors"].length === 0
                ) {
                    // skip sponsors update if no sponsor
                    return;
                }

                const updated = extractValidValues({
                    ...ghStartup2,
                    ...dbStartup2,
                });

                // hack for validation
                updated.phases =
                    updated.phases &&
                    updated.phases.map((p) => {
                        const phase: {
                            end?: Date;
                            name: string;
                            comment?: string;
                            start: Date;
                        } = {
                            name: p.name,
                            comment: p.comment || undefined,
                            start: new Date(p.start),
                        };
                        if (p.end) phase.end = new Date(p.end);
                        return phase;
                    });

                updated.events =
                    updated.events &&
                    updated.events.map((p) => {
                        const event = {
                            name: p.name,
                            date: new Date(p.date),
                            comment: p.comment || undefined,
                        };
                        return event;
                    });

                if (updated.sponsors.length === 0) delete updated.sponsors;
                if (updated.events.length === 0) delete updated.events;

                try {
                    startup.parse(updated);
                } catch (e) {
                    console.error(`ERROR parsing startup ${ghid2}`);
                    console.error(e);
                }

                updates.push({
                    file: `content/_startups/${dbStartup.ghid}.md`,
                    content: dumpYaml(updated, dbStartup.description || ""),
                });
            }
        }
    });

    // update users
    users
        .filter((dbAuthor) => dbAuthor.fullname) // only those with fullname
        .filter((dbAuthor) => dbAuthor.role) // only those with role
        .filter((dbAuthor) => dbAuthor.missions.length) // only those with missions
        .forEach((dbAuthor) => {
            const ghAuthor = markdownData.authors.find(
                (o) => o.attributes.ghid === dbAuthor.username
            );
            const dbAuthor2 = extractValidValues(dbAuthor, [
                "ghid",
                "id",
                "uuid",
                "username",
                "bio",
            ]);
            if (!ghAuthor) {
                // create gh author

                const dbAuthor3 = {
                    ...dbAuthor2,
                    missions: dbAuthor2.missions?.map((m) => {
                        const { uuid, ...mission } = m;
                        return mission;
                    }),
                };
                updates.push({
                    file: `content/_authors/${dbAuthor.username}.md`,
                    content: dumpYaml(dbAuthor3, dbAuthor.bio || ""),
                });
            } else {
                const { ghid: ghid2, ...ghAuthor2 } = ghAuthor.attributes;
                const diffed = detailedDiff(ghAuthor2, dbAuthor2);
                if (
                    Object.keys(diffed.updated).length ||
                    Object.keys(diffed.added).length
                ) {
                    const updated = extractValidValues({
                        ...ghAuthor2,
                        ...dbAuthor2,
                    });

                    // hack for validation
                    updated.missions =
                        updated.missions &&
                        updated.missions.map((p) => {
                            const mission: {
                                end?: Date;
                                start: Date;
                                employer?: string;
                                status?: string;
                                startups?: string[];
                            } = {
                                start: new Date(p.start),
                            };
                            if (p.end) mission.end = new Date(p.end);
                            if (p.status) mission.status = p.status;
                            if (p.employer) mission.employer = p.employer;
                            if (p.startups.length)
                                mission.startups = p.startups;
                            return mission;
                        });
                    if (updated.missions.length === 0) delete updated.missions;

                    try {
                        author.parse(updated);
                    } catch (e) {
                        console.error(`ERROR parsing author ${ghid2}`);
                        console.error(e);
                    }

                    updates.push({
                        file: `content/_authors/${dbAuthor.username}.md`,
                        content: dumpYaml(updated, dbAuthor.bio || ""),
                    });
                }
            }
        });

    return updates;
};

const exportData = async () => {
    // get the original markdowns to compoute changes
    const markdownData = await importFromZip();

    const updates = await getChanges(markdownData);

    // apply changes to some local clone
    const outPath = "./beta.gouv.fr";

    updates.forEach((update) => {
        const outFile = path.join(outPath, update.file);
        writeFile(outFile, update.content);
    });
    console.log(`${updates.length} changes`);
};

exportData();

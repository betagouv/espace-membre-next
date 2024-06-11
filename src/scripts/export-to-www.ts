import path from "path";
import { db, sql } from "@lib/kysely";
import { startup, author, organisation, incubator } from "./github-schemas";
import yaml from "js-yaml";
import { detailedDiff } from "deep-object-diff";
import { writeFile } from "fs/promises";
import {
    withPhases,
    withMissions,
    extractValidValues,
    dumpYaml,
    importFromZip,
} from "./utils";

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
            "github",
            "title",
            "website",
            "incubators.ghid",
            sql<string>`CASE WHEN organizations.ghid IS NOT NULL then concat('/organisations/', organizations.ghid) else NULL END`.as(
                "owner"
            ),
        ])
        .execute();
    const startupColumns = [
        "startups.id",
        "startups.description",
        "startups.accessibility_status",
        "startups.analyse_risques",
        "startups.analyse_risques_url",
        "startups.mon_service_securise",
        "startups.budget_url",
        "startups.contact",
        "startups.link",
        "startups.stats",
        "startups.stats_url",
        "startups.github",
        "startups.name",
        "startups.pitch",
        "startups.website",
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
        .select((eb) => [
            ...startupColumns,
            eb.ref("startups.github").as("repository"),
            eb.ref("startups.name").as("title"),
            eb.ref("startups.pitch").as("mission"),
            eb.ref("startups.website").as("link"),
            sql<
                Array<string>
            >`COALESCE(NULLIF(ARRAY_AGG(CONCAT('/organisations/', organizations.ghid)), '{/organisations/}'), '{}')`.as(
                "sponsors"
            ),
            withPhases(eb),
        ])
        .groupBy([...startupColumns, "startups.uuid"])
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
        if (!ghOrga) {
            // create gh orga
            updates.push({
                file: `content/_organisations/${dbOrga.ghid}.md`,
                content: "---\n" + yaml.dump(dbOrga) + "---\n",
            });
        } else {
            const { ghid: ghid2, ...ghOrga2 } = ghOrga.attributes;
            const dbOrga2 = extractValidValues(dbOrga, ["ghid", "username"]);
            const diffed = detailedDiff(ghOrga2, dbOrga2);
            if (
                Object.keys(diffed.added).length ||
                Object.keys(diffed.updated).length
            ) {
                const updated = { ...ghOrga2, ...dbOrga2 };
                organisation.parse(updated);
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
        if (!ghIncub) {
            // create gh orga
            updates.push({
                file: `content/_incubators/${dbIncub.ghid}.md`,
                content: dumpYaml(dbIncub),
            });
        } else {
            // dont update null values from DB
            const dbIncub2 = extractValidValues(dbIncub, ["ghid"]);
            const { ghid: ghid2, ...ghIncub2 } = ghIncub.attributes;
            const diffed = detailedDiff(ghIncub2, dbIncub2);
            if (
                Object.keys(diffed.updated).length ||
                Object.keys(diffed.added).length
            ) {
                const updated = { ...ghIncub2, ...dbIncub2 };
                incubator.parse(updated);
                updates.push({
                    file: `content/_incubators/${dbIncub.ghid}.md`,
                    content: dumpYaml(updated),
                });
            }
        }
    });

    // update startups
    startups.forEach((dbStartup) => {
        const ghStartup = markdownData.startups.find(
            (o) => o.attributes.ghid === dbStartup.id
        );
        if (!ghStartup) {
            // create gh startup
            updates.push({
                file: `content/_startups/${dbStartup.id}.md`,
                content: dumpYaml(dbStartup, dbStartup.description || ""),
            });
        } else {
            const dbStartup2 = extractValidValues(dbStartup, [
                "ghid",
                "id",
                "description",
                "name",
                "pitch",
                "github",
                "website",
            ]);

            const { ghid: ghid2, ...ghStartup2 } = ghStartup.attributes;
            const diffed = detailedDiff(ghStartup2, dbStartup2);
            if (
                Object.keys(diffed.updated).length ||
                Object.keys(diffed.added).length
            ) {
                if (
                    diffed.updated.sponsors &&
                    Object.keys(diffed.updated).length === 1
                ) {
                    // skip sponsors update if only order change
                    return;
                }
                if (
                    diffed.added.sponsors &&
                    Object.keys(diffed.added).length === 1 &&
                    diffed.added.sponsors.length === 0
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
                        const phase = {
                            name: p.name,
                            comment: p.comment || undefined,
                            start: new Date(p.start),
                        };
                        if (p.end) phase.end = new Date(p.end);
                        return phase;
                    });
                if (updated.sponsors.length === 0) delete updated.sponsors;

                startup.parse(updated);

                updates.push({
                    file: `content/_startups/${dbStartup.id}.md`,
                    content: dumpYaml(updated, dbStartup.description || ""),
                });
            }
        }
    });

    // update startups
    users.forEach((dbAuthor) => {
        const ghAuthor = markdownData.authors.find(
            (o) => o.attributes.ghid === dbAuthor.username
        );
        if (!ghAuthor) {
            // create gh startup
            updates.push({
                file: `content/_authors/${dbAuthor.username}.md`,
                content: dumpYaml(dbAuthor, dbAuthor.bio || ""),
            });
        } else {
            const dbAuthor2 = extractValidValues(dbAuthor, [
                "ghid",
                "id",
                "uuid",
                "username",
                "bio",
            ]);

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
                        const mission = {
                            start: new Date(p.start),
                        };
                        if (p.end) mission.end = new Date(p.end);
                        if (p.status) mission.status = p.status;
                        if (p.employer) mission.employer = p.employer;
                        if (p.startups.length) mission.startups = p.startups;
                        return mission;
                    });
                if (updated.missions.length === 0) delete updated.missions;

                author.parse(updated);

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
    const markdownData = await importFromZip();

    const updates = await getChanges(markdownData);

    const outPath = "../beta.gouv.fr";

    updates.forEach((update) => {
        const outFile = path.join(outPath, update.file);
        writeFile(outFile, update.content);
    });
    console.log(`${updates.length} changes`);
};

exportData();

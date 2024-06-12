const { Readable } = require("stream"); // import doesnt work for some reason

import yaml from "js-yaml";
import { DB } from "@/@types/db";
import { jsonArrayFrom } from "@/lib/kysely";
import fm from "front-matter";
import { ExpressionBuilder, sql } from "kysely";
import { ZodSchema, z } from "zod";
import { startup, author, organisation, incubator } from "./github-schemas";
import unzipper, { Entry } from "unzipper";

type FmReturn<T> = ReturnType<typeof fm<T>>;

export const parseMarkdown = async <T extends ZodSchema>(
    id: string,
    content: string
) => {
    try {
        const { attributes, body } = fm<z.infer<T>>(content);
        return { attributes: { ...attributes, ghid: id }, body };
    } catch (e) {
        console.error(e);
        return { attributes: {}, body: null };
    }
};

// remove null/undefined/excluded keys
export const extractValidValues = <T extends object>(
    obj: T,
    keys: string[] = []
): Partial<T> =>
    Object.keys(obj).reduce((a, c) => {
        if (
            !keys.includes(c) &&
            obj[c] !== null &&
            obj[c] !== undefined &&
            obj[c] !== ""
        ) {
            return { ...a, [c]: obj[c] };
        }
        return a;
    }, {});

export const dumpYaml = (attributes, body = "") =>
    "---\n" +
    yaml
        .dump(attributes, { lineWidth: -1 })
        // hack for js-yaml dumps for short dates
        .replace(/start: ([\d-]{10})T.*/g, "start: $1")
        .replace(/end: ([\d-]{10})T.*/g, "end: $1")
        .replace(/date: ([\d-]{10})T.*/g, "date: $1") +
    "---\n" +
    body;

export function withMissions(eb: ExpressionBuilder<DB, "users">) {
    return jsonArrayFrom(
        eb
            .selectFrom(["missions"])
            .leftJoin(
                "missions_startups",
                "missions_startups.mission_id",
                "missions.uuid"
            )
            .leftJoin(
                "startups",
                "startups.uuid",
                "missions_startups.startup_id"
            )
            .select((eb2) => [
                "missions.uuid",
                "missions.start",
                "missions.end",
                "missions.employer",
                "missions.status",
                // aggregate startups names
                sql<
                    Array<string>
                >`coalesce(array_agg(startups.id order by startups.id) filter (where startups.id is not null), '{}')`.as(
                    "startups"
                ),
            ])
            .whereRef("missions.user_id", "=", "users.uuid")
            // .whereRef("missions.uuid", "=", "missions_startups.mission_id")
            .orderBy("missions.start", "asc")
            .groupBy("missions.uuid")
    ).as("missions");
}

export function withPhases(eb: ExpressionBuilder<DB, "startups">) {
    return jsonArrayFrom(
        eb
            .selectFrom("phases")
            .select([
                "phases.name",
                "phases.comment",
                "phases.start",
                "phases.end",
            ])
            .whereRef("phases.startup_id", "=", "startups.uuid")
            .orderBy("phases.start", "asc")
    ).as("phases");
}

const zipUrl = `https://github.com/betagouv/beta.gouv.fr/archive/refs/heads/master.zip`;

// load ZIP and parse markdowns
export const importFromZip = () => {
    const markdownData: {
        incubators: FmReturn<z.infer<typeof incubator> & { ghid: string }>[];
        organisations: FmReturn<
            z.infer<typeof organisation> & { ghid: string }
        >[];
        startups: FmReturn<z.infer<typeof startup> & { ghid: string }>[];
        authors: FmReturn<z.infer<typeof author> & { ghid: string }>[];
    } = {
        incubators: [],
        organisations: [],
        startups: [],
        authors: [],
    };

    const schemas: Record<keyof typeof markdownData, ZodSchema> = {
        incubators: incubator,
        organisations: organisation,
        startups: startup,
        authors: author,
    };

    return new Promise(async (resolve) => {
        const dataStream = await fetch(zipUrl).then((r) => r.body);
        if (!dataStream) return;

        await Readable.fromWeb(dataStream)
            .pipe(unzipper.Parse())
            .on("entry", function (entry: Entry) {
                let drain = true;
                Object.keys(markdownData).forEach(async (key) => {
                    if (
                        entry.path.match(
                            new RegExp(`/content\/_${key}\/.*\.md$`)
                        )
                    ) {
                        drain = false;
                        const id = entry.path.replace(
                            /^.*\/([^/]*)\.md$/,
                            "$1"
                        );
                        const schema = schemas[key];
                        const content = await entry.buffer();
                        const parsed = await parseMarkdown<typeof schema>(
                            id,
                            content.toString()
                        );
                        markdownData[key].push(parsed);
                    }
                });
                if (drain) entry.autodrain();
            })
            .on("finish", () => {
                console.log(
                    "\n",
                    "Parsed",
                    Object.values(markdownData).reduce(
                        (a, c) => a + c.length,
                        0
                    ),
                    "files",
                    "\n"
                );
                resolve(markdownData);
            })
            .on("error", (e) => {
                console.log("e", e);
                throw e;
            })
            .promise();
    });
};

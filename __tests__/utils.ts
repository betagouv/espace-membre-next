import jwt from "jsonwebtoken";
import { Selectable } from "kysely/dist/cjs/util/column-type";
import nock from "nock";
import { Client } from "pg";
import { parse } from "pg-connection-string";
import { v4 as uuidv4 } from "uuid";

import testStartups from "./startups.json";
import testUsers from "./users.json";
import { Startups, UsersDomaineEnum } from "@/@types/db";
import { db } from "@/lib/kysely";
import { startupToModel } from "@/models/mapper";
import { Domaine, EmailStatusCode } from "@/models/member";
import config from "@/server/config";
import { stopBossClientInstance } from "@/server/queueing/client";
import knex from "@db";

const testUtils = {
    getJWT(id: string) {
        const token = jwt.sign(
            {
                id,
                user: {
                    id,
                },
            },
            config.secret,
            {
                algorithm: "HS512", // Assurez-vous que l'algorithme correspond à celui utilisé pour signer le token
                expiresIn: "7 days",
            }
        );
        return token;
    },
    mockUsers() {
        const url = process.env.USERS_API || "https://beta.gouv.fr"; // can't replace with config.usersApi ?
        return nock(url)
            .get((uri) => uri.includes("authors.json"))
            .reply(200, testUsers)
            .persist();
    },
    mockStartups() {
        const url = config.startupsAPI || "https://beta.gouv.fr"; // can't replace with config.startupsApi ?
        return nock(url)
            .get((uri) => uri.includes("startups.json"))
            .reply(200, testStartups)
            .persist();
    },
    mockStartupsDetails() {
        const url = config.startupsDetailsAPI || "https://beta.gouv.fr"; // can't replace with config.startupsApi ?
        return nock(url)
            .get((uri) => uri.includes("startups_details.json"))
            .reply(200, testStartups)
            .persist();
    },
    mockSlackSecretariat() {
        if (config.CHAT_WEBHOOK_URL_SECRETARIAT) {
            return nock(config.CHAT_WEBHOOK_URL_SECRETARIAT)
                .post(/.*/)
                .reply(200)
                .persist();
        }
        throw new Error("config.CHAT_WEBHOOK_URL_SECRETARIAT not defined");
    },
    mockSlackGeneral() {
        if (config.CHAT_WEBHOOK_URL_GENERAL) {
            return nock(config.CHAT_WEBHOOK_URL_GENERAL)
                .post(/.*/)
                .reply(200)
                .persist();
        }
        throw new Error("config.CHAT_WEBHOOK_URL_GENERAL not defined");
    },
    mockOvhUserEmailInfos() {
        return nock(/.*ovh.com/)
            .get(/^.*email\/domain\/.*\/account\/+.+/) // <-> /email/domain/betagouv.ovh/account/membre.actif
            .reply(404)
            .persist();
    },
    mockOvhUserResponder() {
        return nock(/.*ovh.com/)
            .get(/^.*email\/domain\/.*\/responder\/+.+/) // <-> /email/domain/betagouv.ovh/responder/membre.actif
            .reply(404)
            .persist();
    },
    mockOvhAllEmailInfos() {
        return nock(/.*ovh.com/)
            .get(/^.*email\/domain\/.*\/account/)
            .reply(
                200,
                testUsers.map((x) => x.id)
            )
            .persist();
    },
    mockOvhRedirectionWithQueries() {
        return nock(/.*ovh.com/)
            .get(/^.*email\/domain\/.*\/redirection/)
            .query((x) => Boolean(x.from && x.to))
            .reply(200, ["398284990"])
            .persist();
    },
    mockOvhRedirections() {
        return nock(/.*ovh.com/)
            .get(/^.*email\/domain\/.*\/redirection/)
            .reply(200, [])
            .persist();
    },
    mockOvhChangePassword() {
        return nock(/.*ovh.com/)
            .post(/^.*email\/domain\/.*\/account\/+.+\/changePassword/)
            .reply(200, [])
            .persist();
    },
    mockOvhTime() {
        return nock(/.*ovh.com/)
            .get(/^.*auth\/time/)
            .reply(200, [Math.trunc(new Date().getTime() / 1000)])
            .persist();
    },
    cleanMocks() {
        nock.cleanAll();
        nock.enableNetConnect();
    },
    setupTestDatabase() {
        console.log("Setup test database");
        const dbConfig = parse(process.env.DATABASE_URL || "");
        const testDbName = dbConfig.database;
        if (!testDbName)
            return new Error("DATABASE_URL environment variable not set");

        // Postgres needs to have a connection to an existing database in order
        // to perform any request. Since our test database doesn't exist yet,
        // we need to connect to the default database to create it.
        console.log(`Creating test database ${testDbName}...`);
        const temporaryConnection = `postgres://${encodeURIComponent(
            dbConfig.user || ""
        )}:${encodeURIComponent(dbConfig.password || "")}@${encodeURIComponent(
            dbConfig.host || ""
        )}:${encodeURIComponent(dbConfig.port || "")}/postgres`;
        const client = new Client({ connectionString: temporaryConnection });
        return client
            .connect()
            .then(() =>
                client.query(`DROP DATABASE IF EXISTS ${testDbName}`, [])
            )
            .then(() => client.query(`CREATE DATABASE ${testDbName}`, []))
            .then(() => client.end())
            .then(() => knex.migrate.latest())
            .then(async () => {})
            .then(() =>
                console.log(`Test database ${testDbName} created successfully`)
            )
            .catch((err) => {
                console.log(err);
            });
    },
    async cleanUpTestDatabase() {
        const dbConfig = parse(process.env.DATABASE_URL || "");
        const testDbName = dbConfig.database;
        if (!testDbName)
            return new Error("DATABASE_URL environment variable not set");

        // Postgres can't remove a database in use, so we will have to
        // connect to the default database to clean up.
        console.log(`Cleaning up test database ${testDbName}...`);
        const temporaryConnection = `postgres://${encodeURIComponent(
            dbConfig.user || ""
        )}:${encodeURIComponent(dbConfig.password || "")}@${encodeURIComponent(
            dbConfig.host || ""
        )}:${encodeURIComponent(dbConfig.port || "")}/postgres`;
        const client = new Client({ connectionString: temporaryConnection });
        await db.destroy();
        await stopBossClientInstance();

        return knex
            .destroy()
            .then(() => client.connect())
            .then(() => client.query(`DROP DATABASE ${testDbName}`, []))
            .then(() => client.end())
            .then(() =>
                console.log(
                    `Test database ${testDbName} cleaned up successfully`
                )
            );
    },
    randomUuid: function randomUuid() {
        return uuidv4();
    },
    createStartup: async function (
        incubator_id: string,
        name: string
    ): Promise<Selectable<Startups>> {
        const insertedStartup = await db
            .insertInto("startups")
            .values({
                ghid: name,
                name: name,
                incubator_id,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
        return insertedStartup;
    },
    createUsers: async (
        users: {
            start?: string;
            end?: string;
            id: string;
            fullname: string;
            role?: string;
            employer?: string;
            domaine?: Domaine | string;
            secondary_email?: string;
            github?: string;
            primary_email?: string | null;
            missions?: {
                start: string;
                end?: string;
                status?: string;
                startups?: (
                    | "a-startup-at-gip"
                    | "a-startup-at-dinum"
                    | "anotherstartup"
                    | "test-startup"
                )[];
                employer?: string;
            }[];
        }[]
    ) => {
        const sixMinutesInMs: number = 6 * 1000 * 60;
        const dbUsers = users.map((user) => ({
            username: user.id,
            fullname: user.fullname,
            primary_email:
                user.primary_email || user.primary_email === null
                    ? user.primary_email
                    : `${user.id}@${config.domain}`,
            primary_email_status_updated_at: new Date(
                Date.now() - sixMinutesInMs
            ),
            primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
            github: user.github,
            secondary_email: user.secondary_email,
            domaine: (user.domaine || Domaine.ANIMATION) as UsersDomaineEnum,
            role: user.role || "",
        }));
        const createdUsers = await db
            .insertInto("users")
            .values(dbUsers)
            .returningAll()
            .execute();
        for (const createdUser of createdUsers) {
            const missionUser = users.find(
                (user) => user.id === createdUser.username
            );
            if (missionUser?.missions) {
                const missions =
                    users.find((user) => user.id === createdUser.username)
                        ?.missions || [];
                for (const mission of missions) {
                    const insertedRow = await db
                        .insertInto("missions")
                        .values({
                            start: mission.start,
                            end: mission.end,
                            employer: mission.employer,
                            user_id: createdUser.uuid,
                        })
                        .returningAll()
                        .executeTakeFirstOrThrow();
                    for (const startup of mission.startups || []) {
                        const insertedStartup = await db
                            .insertInto("startups")
                            .values({
                                ghid: startup,
                                name: startup,
                            })
                            .onConflict((oc) => {
                                return oc.column("ghid").doUpdateSet({
                                    ghid: startup,
                                    name: startup,
                                });
                            })
                            .returningAll()
                            .executeTakeFirstOrThrow();
                        await db
                            .insertInto("missions_startups")
                            .values({
                                mission_id: insertedRow.uuid,
                                startup_id: insertedStartup.uuid,
                            })
                            .execute();
                    }
                }
            } else {
                await db
                    .insertInto("missions")
                    .values({
                        start: missionUser?.start!,
                        end: missionUser?.end,
                        user_id: createdUser.uuid,
                    })
                    .execute();
            }
        }
    },
    deleteUsers: async (
        users: {
            star?: string;
            end?: string;
            id: string;
            fullname: string;
            role?: string;
            employer?: string;
            domaine?: Domaine | string;
            secondary_email?: string;
            github?: string;
            missions?: {
                start: string;
                end?: string;
                status?: string;
                employer?: string;
            }[];
        }[]
    ) => {
        const createdUsers = await db
            .deleteFrom("users")
            .where(
                "username",
                "in",
                users.map((user) => user.id)
            )
            .returningAll()
            .execute();
        // const deletedRows = await db
        //     .deleteFrom("missions")
        //     .where(
        //         "user_id",
        //         "in",
        //         createdUsers.map((u) => u.uuid)
        //     )
        //     .execute();
    },
};

export default testUtils;

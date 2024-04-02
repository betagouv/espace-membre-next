import jwt from "jsonwebtoken";
import nock from "nock";
import { Client } from "pg";
import { parse } from "pg-connection-string";
import { v4 as uuidv4 } from "uuid";

import testStartups from "./startups.json";
import testUsers from "./users.json";
import config from "@/server/config";
import knex from "@db";

export default {
    getJWT(id) {
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
        console.log(token);
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
        const dbConfig = parse(process.env.DATABASE_URL);
        const testDbName = dbConfig.database;
        if (!testDbName)
            return new Error("DATABASE_URL environment variable not set");

        // Postgres needs to have a connection to an existing database in order
        // to perform any request. Since our test database doesn't exist yet,
        // we need to connect to the default database to create it.
        console.log(`Creating test database ${testDbName}...`);
        const temporaryConnection = `postgres://${encodeURIComponent(
            dbConfig.user
        )}:${encodeURIComponent(dbConfig.password)}@${encodeURIComponent(
            dbConfig.host
        )}:${encodeURIComponent(dbConfig.port)}/postgres`;
        const client = new Client({ connectionString: temporaryConnection });
        return client
            .connect()
            .then(() =>
                client.query(`DROP DATABASE IF EXISTS ${testDbName}`, [])
            )
            .then(() => client.query(`CREATE DATABASE ${testDbName}`, []))
            .then(() => client.end())
            .then(() => knex.migrate.latest())
            .then(() => {
                const sixMinutesInMs: number = 6 * 1000 * 60;
                const dbUsers = testUsers.map((user) => ({
                    username: user.id,
                    primary_email: `${user.id}@${config.domain}`,
                    primary_email_status_updated_at: new Date(
                        Date.now() - sixMinutesInMs
                    ),
                }));
                return knex("users").insert(dbUsers);
            })
            .then(() =>
                console.log(`Test database ${testDbName} created successfully`)
            )
            .catch((err) => {
                console.log(err);
            });
    },
    cleanUpTestDatabase() {
        const dbConfig = parse(process.env.DATABASE_URL);
        const testDbName = dbConfig.database;
        if (!testDbName)
            return new Error("DATABASE_URL environment variable not set");

        // Postgres can't remove a database in use, so we will have to
        // connect to the default database to clean up.
        console.log(`Cleaning up test database ${testDbName}...`);
        const temporaryConnection = `postgres://${encodeURIComponent(
            dbConfig.user
        )}:${encodeURIComponent(dbConfig.password)}@${encodeURIComponent(
            dbConfig.host
        )}:${encodeURIComponent(dbConfig.port)}/postgres`;
        const client = new Client({ connectionString: temporaryConnection });

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
};

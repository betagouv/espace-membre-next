import chai from "chai";
import chaiHttp from "chai-http";
import * as nextAuth from "next-auth/next";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { createData, deleteData } from "./utils/fakeData";
import { testUsers } from "./utils/users-data";
import { db } from "@/lib/kysely";
import { SponsorDomaineMinisteriel, SponsorType } from "@/models/sponsor";
import { StartupPhase } from "@/models/startup";
import { AuthorizationError } from "@/utils/error";

chai.use(chaiHttp);

describe("Test startup server action", () => {
    describe("post /api/startups/:startup unauthenticated", () => {
        let getServerSessionStub;
        let updateStartup;
        beforeEach(async () => {
            getServerSessionStub = sinon
                .stub(nextAuth, "getServerSession")
                .resolves({});

            await createData(testUsers);
            const mockSession = {
                user: {},
            };
            getServerSessionStub.resolves(mockSession);
        });
        afterEach(async () => {
            sinon.restore();
            await deleteData(testUsers);
        });
        it("should not allow unauthenticated user to update startups", async () => {
            const startup = await db
                .selectFrom("startups")
                .selectAll()
                .where("ghid", "=", "test-startup")
                .executeTakeFirstOrThrow();
            const cacheStub = {
                revalidatePath: sinon.stub(),
            };

            const actions = proxyquire("@/app/api/startups/actions", {
                "next/cache": cacheStub,
            });
            updateStartup = actions.updateStartup;
            console.log(startup);
            try {
                await updateStartup({
                    formData: {
                        startup: {
                            contact: "",
                            description: "",
                            incubator_id: "",
                            name: "",
                            pitch: "",
                        },
                        startupEvents: [],
                        startupPhases: [],
                        startupSponsors: [],
                        newSponsors: [],
                        newPhases: [],
                    },
                    startupUuid: startup.uuid,
                });
            } catch (error) {
                error.should.be.instanceof(AuthorizationError);
            }
        });
    });

    describe("post /api/startups/:startup authenticated", () => {
        let getServerSessionStub;
        let user;
        let startup;
        let updateStartup;
        beforeEach(async () => {
            getServerSessionStub = sinon
                .stub(nextAuth, "getServerSession")
                .resolves({});

            const cacheStub = {
                revalidatePath: sinon.stub(),
            };

            const actions = proxyquire("@/app/api/startups/actions", {
                "next/cache": cacheStub,
            });
            updateStartup = actions.updateStartup;
            await createData(testUsers);
            user = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", "membre.actif")
                .executeTakeFirstOrThrow();
            const mockSession = {
                user: {
                    id: "membre.actif",
                    isAdmin: false,
                    uuid: user.uuid,
                },
            };
            startup = await db
                .selectFrom("startups")
                .selectAll()
                .where("ghid", "=", "test-startup")
                .executeTakeFirstOrThrow();
            getServerSessionStub.resolves(mockSession);
        });
        afterEach(async () => {
            sinon.restore();
            await db.deleteFrom("events").execute();

            await deleteData(testUsers);
        });

        it("should update product if date and phase are valid", async () => {
            await updateStartup({
                formData: {
                    startup: {
                        contact: "",
                        description: "la description de la startup",
                        incubator_id: startup.incubator_id,
                        name: "title de la se",
                        pitch: "lamissiondelastartup",
                    },
                    startupEvents: [],
                    startupPhases: [
                        {
                            name: StartupPhase.PHASE_ALUMNI,
                            start: new Date(),
                        },
                    ],
                    startupSponsors: [],
                    newSponsors: [],
                    newPhases: [],
                },
                startupUuid: startup.uuid,
            });
            const updatedStartup = await db
                .selectFrom("startups")
                .selectAll()
                .where("uuid", "=", startup.uuid)
                .executeTakeFirstOrThrow();
            updatedStartup.pitch?.should.equals("lamissiondelastartup");
            updatedStartup.name.should.equals("title de la se");
            updatedStartup.description?.should.equals(
                "la description de la startup"
            );
        });
    });

    describe("post /api/startups/:startup/create-form authenticated", () => {
        let getServerSessionStub;
        let user;
        let startup;
        let createStartup;
        beforeEach(async () => {
            getServerSessionStub = sinon
                .stub(nextAuth, "getServerSession")
                .resolves({});

            await createData(testUsers);
            const cacheStub = {
                revalidatePath: sinon.stub(),
            };

            const actions = proxyquire("@/app/api/startups/actions", {
                "next/cache": cacheStub,
            });
            createStartup = actions.createStartup;
            user = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", "membre.actif")
                .executeTakeFirstOrThrow();
            const mockSession = {
                user: {
                    id: "membre.actif",
                    isAdmin: false,
                    uuid: user.uuid,
                },
            };
            startup = await db
                .selectFrom("startups")
                .selectAll()
                .where("ghid", "=", "test-startup")
                .executeTakeFirstOrThrow();
            getServerSessionStub.resolves(mockSession);
        });
        afterEach(async () => {
            sinon.restore();
            await db.deleteFrom("events").execute();
            await db
                .deleteFrom("startups")
                .where("ghid", "=", "title-de-la-se")
                .execute();
            await deleteData(testUsers);
        });

        it("should create product if date and phase are valid", async () => {
            await createStartup({
                formData: {
                    startup: {
                        pitch: "lamissiondelastartup",
                        description: "la description de la startup",
                        name: "title de la se",
                        contact: "lamissiondelastartup@beta.gouv.fr",
                        incubator_id: (
                            await db
                                .selectFrom("incubators")
                                .selectAll()
                                .executeTakeFirstOrThrow()
                        ).uuid,
                    },
                    startupPhases: [
                        {
                            name: StartupPhase.PHASE_ALUMNI,
                            start: new Date(),
                        },
                    ],
                    newSponsors: [
                        {
                            ghid: "asponsors",
                            name: "a sponsors",
                            acronym: "AS",
                            type: SponsorType.SPONSOR_TYPE_OPERATEUR,
                            domaine_ministeriel:
                                SponsorDomaineMinisteriel.SPONSOR_DOMAINE_CULTURE,
                        },
                    ],
                    startupEvents: [],
                    startupSponsors: [],
                    newPhases: [],
                },
            });
            const startups = await db
                .selectFrom("startups")
                .where("ghid", "=", "title-de-la-se")
                .selectAll()
                .execute();
            console.log(startups);
        });
    });
});

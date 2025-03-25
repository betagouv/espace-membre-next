import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import * as nextAuth from "next-auth/next";
import sinon from "sinon";

import utils from "./utils";
import { createData, deleteData } from "./utils/fakeData";
import { testUsers } from "./utils/users-data";
import { updateStartup } from "@/app/api/startups/actions";
import { db } from "@/lib/kysely";
import { StartupPhase } from "@/models/startup";
import * as session from "@/server/helpers/session";
import { AuthorizationError } from "@/utils/error";
import * as betagouv from "@betagouv";
chai.use(chaiHttp);

const base64Image = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII`;
describe("Startup page", () => {
    describe("post /api/startups/:startup unauthenticated", () => {
        let getServerSessionStub;
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
        beforeEach(async () => {
            getServerSessionStub = sinon
                .stub(nextAuth, "getServerSession")
                .resolves({});

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
            await deleteData(testUsers);
        });

        it("should update product if date and phase are valid", async () => {
            await updateStartup({
                formData: {
                    startup: {
                        contact: "",
                        description: "la description de la startup",
                        incubator_id: "",
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

    // describe("post /api/startups/:startup/create-form authenticated", () => {
    //     let getToken;
    //     let updateStartupGithubFileStub;
    //     let startupInfosStub;
    //     beforeEach(() => {
    //         getToken = sinon.stub(session, "getToken");
    //         getToken.returns(utils.getJWT("membre.actif"));
    //         updateStartupGithubFileStub = sinon.stub(
    //             UpdateGithubCollectionEntry,
    //             "updateMultipleFilesPR"
    //         );
    //         updateStartupGithubFileStub.returns(
    //             Promise.resolve({
    //                 html_url: "https://djkajdlskjad.com",
    //                 number: 12151,
    //             })
    //         );
    //         startupInfosStub = sinon.stub(betagouv.default, "startupsInfos");
    //         startupInfosStub.returns(
    //             Promise.resolve([
    //                 {
    //                     id: "a-dock",
    //                     type: "startup",
    //                     attributes: {
    //                         name: "A Dock",
    //                         pitch: "Simplifier l'accès aux données et démarches administratives du transport routier de marchandises",
    //                         stats_url: "https://adock.beta.gouv.fr/stats",
    //                         link: "https://adock.beta.gouv.fr",
    //                         repository: "https://github.com/MTES-MCT/adock-api",
    //                         events: [],
    //                         phases: [
    //                             {
    //                                 name: "investigation",
    //                                 start: "2018-01-08",
    //                                 end: "2018-07-01",
    //                             },

    //                             {
    //                                 name: "construction",
    //                                 start: "2018-07-01",
    //                                 end: "2019-01-23",
    //                             },

    //                             {
    //                                 name: "acceleration",
    //                                 start: "2019-01-23",
    //                                 end: "",
    //                             },
    //                         ],
    //                     },
    //                     relationships: {
    //                         incubator: {
    //                             data: { type: "incubator", id: "mtes" },
    //                         },
    //                     },
    //                 },
    //             ])
    //         );
    //     });

    //     afterEach(() => {
    //         getToken.restore();
    //         updateStartupGithubFileStub.restore();
    //         startupInfosStub.restore();
    //     });

    //     it("should create product if date and phase are valid", async () => {
    //         const res = await chai
    //             .request(app)
    //             .post(routes.STARTUP_POST_INFO_CREATE_FORM)
    //             .set("Content-Type", "application/json") // Set the content type to application/json
    //             .send(
    //                 JSON.stringify({
    //                     startup: "nomdestartup",
    //                     mission: "lamissiondelastartup",
    //                     markdown: "la description de la startup",
    //                     title: "title de la se",
    //                     contact: "lamissiondelastartup@beta.gouv.fr",
    //                     phases: [
    //                         {
    //                             name: "alumni",
    //                             start: new Date().toISOString(),
    //                         },
    //                     ],
    //                     image: base64Image,
    //                     newSponsors: [
    //                         {
    //                             name: "a sponsors",
    //                             acronym: "AS",
    //                             type: "operateur",
    //                             domaine_ministeriel: "culture",
    //                         },
    //                     ],
    //                 })
    //             );
    //         res.should.have.status(200);
    //     });
    // });
});

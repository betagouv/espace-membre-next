import chai from "chai";
import chaiHttp from "chai-http";
import nock from "nock";
import sinon from "sinon";

import utils from "./utils";
import * as mattermost from "@/lib/mattermost";
import routes from "@/routes/routes";
import config from "@/server/config";
import * as session from "@/server/helpers/session";
import app from "@/server/index";
import knex from "@db";

chai.use(chaiHttp);
describe("Community endpoint", () => {
    describe("GET /api/community unauthenticated", () => {
        it("should redirect to login", (done) => {
            chai.request(app)
                .get(`${routes.GET_USER_API}`)
                .redirects(0)
                .end((err, res) => {
                    res.should.have.status(500);
                    done();
                });
        });
    });

    describe("GET /api/community authenticated", () => {
        let getToken;
        let mattermostSearchUserStub;
        let mattermostGetUserStub;

        beforeEach(() => {
            getToken = sinon.stub(session, "getToken");
            getToken.returns(utils.getJWT("membre.actif"));
            mattermostSearchUserStub = sinon
                .stub(mattermost, "searchUsers")
                .returns(
                    Promise.resolve([
                        {
                            email: "adresse.email@beta.gouv.fr",
                        },
                    ])
                );
            mattermostGetUserStub = sinon
                .stub(mattermost, "getUserByEmail")
                .returns(
                    Promise.resolve({
                        email: "adresse.email@beta.gouv.fr",
                    } as mattermost.MattermostUser)
                );
        });

        afterEach(() => {
            getToken.restore();
            mattermostSearchUserStub.restore();
            mattermostGetUserStub.restore();
        });

        it("should return a valid page for an existing user", (done) => {
            chai.request(app)
                .get(
                    `${routes.GET_USER_API.replace(
                        ":username",
                        "membre.parti"
                    )}`
                )
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("object");
                    done();
                });
        });

        it("should redirect to community page if an unknown user is specified", (done) => {
            chai.request(app)
                .get(
                    `${routes.GET_USER_API.replace(
                        ":username",
                        "membre.unknown"
                    )}`
                )
                .redirects(0)
                .end((err, res) => {
                    res.should.have.status(500);
                    done();
                });
        });

        it("should show the user's information if the user exists", (done) => {
            chai.request(app)
                .get(
                    `${routes.GET_USER_API.replace(
                        ":username",
                        "membre.parti"
                    )}`
                )
                .end((err, res) => {
                    chai.expect(res).to.be.json;
                    res.body.userInfos.fullname.should.include("Membre Parti");
                    res.body.userInfos.start.should.include("2016-11-03");
                    res.body.userInfos.end.should.include("2050-10-30");
                    res.body.userInfos.github.should.include("test-github");
                    done();
                });
        });

        it("should show the secondary email if it exists", async () => {
            await knex("users")
                .where({
                    username: "membre.parti",
                })
                .update({
                    secondary_email: "perso@example.com",
                });

            const res = await chai
                .request(app)
                .get(
                    `${routes.GET_USER_API.replace(
                        ":username",
                        "membre.parti"
                    )}`
                );
            res.body.secondaryEmail.should.include("perso@example.com");
            await knex("users")
                .where({
                    username: "membre.parti",
                })
                .update({
                    secondary_email: null,
                });
        });

        it("should not show the secondary email if it does not exist", (done) => {
            chai.request(app)
                .get(
                    `${routes.GET_USER_API.replace(
                        ":username",
                        "membre.parti"
                    )}`
                )
                .end((err, res) => {
                    chai.should().equal(res.body.secondaryEmail, null);
                    done();
                });
        });

        // it("should show the email creation form for email-less users", (done) => {
        //     chai.request(app)
        //         .get(
        //             `${routes.GET_USER_API.replace(
        //                 ":username",
        //                 "membre.parti"
        //             )}`
        //         )
        //         .end((err, res) => {
        //             res.text.should.include(
        //                 'action="/users/membre.parti/email" method="POST"'
        //             );
        //             done();
        //         });
        // });

        // it("should prefill the secondary email for email-less users", async () => {
        //     await knex("users").where({ username: "membre.parti" }).update({
        //         primary_email: "",
        //         secondary_email: "perso@example.com",
        //     });

        //     const res = await chai
        //         .request(app)
        //         .get(
        //             `${routes.GET_USER_API.replace(
        //                 ":username",
        //                 "membre.parti"
        //             )}`
        //         );

        //     res.text.should.include(
        //         '<input value="perso@example.com" name="to_email"'
        //     );
        //     await knex("users")
        //         .where({ username: "membre.parti" })
        //         .update({
        //             primary_email: `membre.parti@${config.domain}`,
        //             secondary_email: null,
        //         });
        // });

        // it("should not show the email creation form for users with existing emails", async () => {
        //     nock.cleanAll();

        //     nock(/.*ovh.com/)
        //         .get(/^.*email\/domain\/.*\/account\/.*/)
        //         .reply(200, { description: "" });
        //     nock(/.*ovh.com/)
        //         .get(/^.*email\/domain\/.*\/responder\/.*/)
        //         .reply(200, { description: "" });
        //     utils.mockUsers();
        //     utils.mockOvhRedirections();
        //     utils.mockOvhTime();
        //     const res = await chai
        //         .request(app)
        //         .get(
        //             `${routes.GET_USER_API.replace(
        //                 ":username",
        //                 "membre.parti"
        //             )}`
        //         );

        //     res.text.should.not.include(
        //         'action="/users/membre.parti/email" method="POST">'
        //     );
        // });

        // it("should not show the email creation form for users expired", (done) => {
        //     nock.cleanAll();

        //     nock(/.*ovh.com/)
        //         .get(/^.*email\/domain\/.*\/account\/.*/)
        //         .reply(200, { description: "" });

        //     utils.mockUsers();
        //     utils.mockOvhUserResponder();
        //     utils.mockOvhRedirections();
        //     utils.mockOvhTime();

        //     chai.request(app)
        //         .get(
        //             `${routes.GET_USER_API.replace(
        //                 ":username",
        //                 "membre.expire"
        //             )}`
        //         )
        //         .end((err, res) => {
        //             res.text.should.include(
        //                 "Contrat de Membre Expiré arrivé à expiration"
        //             );
        //             res.text.should.not.include(
        //                 'action="/users/membre.expire/email" method="POST">'
        //             );
        //             res.text.should.not.include(
        //                 'action="/users/membre.expire/password" method="POST">'
        //             );
        //             res.text.should.include(
        //                 "Le compte membre.expire est expiré."
        //             );
        //             done();
        //         });
        // });
    });
});

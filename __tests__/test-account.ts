import chai from "chai";
import chaiHttp from "chai-http";
import * as nextAuth from "next-auth/next";
import nock from "nock";
import sinon from "sinon";

import utils from "./utils";
import { createData, deleteData } from "./utils/fakeData";
import { testUsers } from "./utils/users-data";
import {
    setEmailResponder,
    updateCommunicationEmail,
} from "@/app/api/member/actions";
import { db } from "@/lib/kysely";
import * as searchCommune from "@/lib/searchCommune";
import { CommunicationEmailCode } from "@/models/member";
import routes from "@/routes/routes";
import app from "@/server/index";

chai.use(chaiHttp);

describe("Test Account", () => {
    describe("Authenticated user should be able to perform use action", () => {
        // first render of template 'account' can be slow and exceed timeout this test may fail if timeout < 2000
        let getServerSessionStub;
        let user;

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
            getServerSessionStub.resolves(mockSession);
        });
        afterEach(async () => {
            sinon.restore();
            await deleteData(testUsers);
        });

        it("should set email responder", async () => {
            const createEmailResponder = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/responder.*/) // <-> /email/domain/betagouv.ovh/responder/membre.actif
                .reply(200);

            await setEmailResponder({
                from: "2020-01-01",
                to: "2021-01-01",
                content: "Je ne serai pas la cette semaine",
            });

            createEmailResponder.isDone().should.be.true;
        });

        it("should update email responder", async () => {
            utils.cleanMocks();
            utils.mockSlackGeneral();
            utils.mockSlackSecretariat();
            utils.mockOvhTime();
            utils.mockOvhUserEmailInfos();
            utils.mockOvhAllEmailInfos();
            utils.mockOvhTime();
            utils.mockOvhRedirections();
            const id = "membre.actif";
            const getEmailResponder = nock(/.*ovh.com/)
                .get(/^.*email\/domain\/.*\/responder\/+.+/) // <-> /email/domain/betagouv.ovh/responder/membre.actif
                .reply(200, {
                    content: `mon message d'absence`,
                    from: new Date(),
                    to: new Date(),
                    account: id,
                    copy: false,
                });
            const updateEmailResponder = nock(/.*ovh.com/)
                .put(/^.*email\/domain\/.*\/responder\/+.+/) // <-> /email/domain/betagouv.ovh/responder/membre.actif
                .reply(200);

            await setEmailResponder({
                from: "2020-01-01",
                to: "2021-01-01",
                content: "Je ne serai pas la cette semaine",
            });
            updateEmailResponder.isDone().should.be.true;
            getEmailResponder.isDone().should.be.true;
            utils.mockOvhUserResponder();
        });

        // it("should update user info", async () => {
        //     const fetchCommuneDetailsStub = sinon
        //         .stub(searchCommune, "fetchCommuneDetails")
        //         .returns(Promise.resolve(null));
        //     await chai
        //         .request(app)
        //         .post(routes.ACCOUNT_POST_DETAIL_INFO_FORM)
        //         // .type("form")
        //         .send({
        //             gender: "female",
        //             workplace_insee_code: "",
        //             tjm: 800,
        //             legal_status: "AE",
        //         });
        //     const user = await knex("users")
        //         .where({ username: "membre.actif" })
        //         .first();
        //     user.gender.should.equal("female");
        //     user.tjm.should.equal(800);
        //     fetchCommuneDetailsStub.restore();
        // });

        it("should update communication_email value", async () => {
            const username = "membre.actif";
            await db
                .updateTable("users")
                .where("username", "=", username)
                .set({
                    secondary_email: "membre.actif@gmail.com",
                })
                .execute();
            await updateCommunicationEmail(CommunicationEmailCode.PRIMARY);
            let user = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", username)
                .executeTakeFirstOrThrow();
            user.communication_email?.should.equal(
                CommunicationEmailCode.PRIMARY
            );
            await updateCommunicationEmail(CommunicationEmailCode.SECONDARY);
            user = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", username)
                .executeTakeFirstOrThrow();
            user.communication_email?.should.equal(
                CommunicationEmailCode.SECONDARY
            );
        });
    });
});

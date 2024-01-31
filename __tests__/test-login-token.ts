import chai from "chai";
import chaiHttp from "chai-http";
import crypto from "crypto";
import sinon from "sinon";
import config from "@/server/config";
import * as controllerUtils from "@controllers/utils";
import knex from "@db";
import db from "@db";
import { EmailStatusCode } from "@/models/dbUser/dbUser";
import * as session from "@/server/helpers/session";
import app from "@/server/index";
import routes from "@/routes/routes";

chai.use(chaiHttp);

describe("Login token", () => {
    let sendEmailStub;
    let getJwtTokenForUser;

    beforeEach((done) => {
        sendEmailStub = sinon
            .stub(controllerUtils, "sendMail")
            .returns(Promise.resolve(true));
        getJwtTokenForUser = sinon.spy(session, "getJwtTokenForUser");
        done();
    });

    afterEach((done) => {
        sendEmailStub.restore();
        getJwtTokenForUser.restore();
        done();
    });

    it("should be stored after login request", async () => {
        const userEmail = `membre.nouveau@${config.domain}`;
        await db("users")
            .insert({
                primary_email: userEmail,
                username: "membre.nouveau",
                primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
            })
            .onConflict("username")
            .merge();

        // Make a login request to generate a token
        await chai.request(app).post(routes.LOGIN_API).type("form").send({
            emailInput: userEmail,
        });

        const dbRes = await knex("login_tokens")
            .select()
            .where({ email: userEmail });
        dbRes.length.should.equal(1);
        dbRes[0].email.should.equal(userEmail);
        dbRes[0].username.should.equal("membre.nouveau");
    });

    it("should be deleted after use", async () => {
        const userEmail = `membre.actif@${config.domain}`;
        // Make a login request to generate a token
        await chai.request(app).post(routes.LOGIN_API).type("form").send({
            emailInput: userEmail,
        });

        // Extract token from the DB
        const token = await knex("login_tokens")
            .select()
            .where({ email: userEmail })
            .then((dbRes) => dbRes[0].token);
        await chai
            .request(app)
            .post(`/api/signin`)
            .type("form")
            .send({
                next: "/community",
                token: encodeURIComponent(token),
            });
        const dbRes = await knex("login_tokens")
            .select()
            .where({ email: userEmail });
        dbRes.length.should.equal(0);
    });

    it("should only be usable once", async () => {
        const userEmail = `membre.actif@${config.domain}`;
        let token = null;

        // Make a login request to generate a token
        await chai.request(app).post(routes.LOGIN_API).type("form").send({
            emailInput: userEmail,
        });

        // Extract token from the DB
        token = await knex("login_tokens")
            .select()
            .where({ email: userEmail })
            .then((dbRes) => (token = dbRes[0].token));

        const res1 = await chai
            .request(app)
            .post(`/api/signin`)
            .type("form")
            .send({
                next: "/community",
                token: encodeURIComponent(token),
            })
            .redirects(0);
        getJwtTokenForUser.calledOnce.should.be.true;

        // Make the same GET request again (second time)
        const res2 = await chai
            .request(app)
            .post(`/api/signin`)
            .type("form")
            .send({
                next: "/community",
                token: encodeURIComponent(token),
            })
            .redirects(0);

        // Ensure the response did NOT set an auth cookie
        getJwtTokenForUser.calledTwice.should.be.false;
    });

    it("should work if user has no primary_email", async () => {
        const userEmail = `membre.actif@email.toto`;

        await db("users")
            .insert({
                primary_email: null,
                secondary_email: userEmail,
                username: "membre.nouveau",
                primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
            })
            .onConflict("username")
            .merge();

        // Make a login request to generate a token
        await chai.request(app).post(routes.LOGIN_API).type("form").send({
            emailInput: userEmail,
        });

        // Extract token from the DB
        const token = await knex("login_tokens")
            .select()
            .where({ email: userEmail })
            .then((dbRes) => dbRes[0].token);

        await chai
            .request(app)
            .post(routes.SIGNIN_API)
            .type("form")
            .send({
                next: "/community",
                token: encodeURIComponent(token),
            });
        const dbRes = await knex("login_tokens")
            .select()
            .where({ email: userEmail });
        dbRes.length.should.equal(0);

        await db("users")
            .update({
                primary_email: `membre.nouveau@${config.domain}`,
                secondary_email: null,
                primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
            })
            .where({
                username: "membre.nouveau",
            });
    });

    it("should not be used if expired", async () => {
        // Create expired token
        const userEmail = `membre.actif@${config.domain}`;
        const token = crypto.randomBytes(256).toString("base64");
        const expirationDate = new Date();

        await knex("login_tokens").insert({
            token,
            username: "membre.actif",
            email: userEmail,
            expires_at: expirationDate,
        });
        // Try to login using this expired token
        await chai
            .request(app)
            .post(routes.SIGNIN_API)
            .type("form")
            .send({
                next: "/community",
                token: encodeURIComponent(token),
            });
        // Ensure the response did NOT set an auth cookie
        getJwtTokenForUser.calledOnce.should.be.false;
    });
});

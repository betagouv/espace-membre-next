import chai from "chai";
import chaiHttp from "chai-http";
import app from "@/server/index";
import routes from "@/routes/routes";
import utils from "./utils";
import sinon from "sinon";
import * as session from "@/server/helpers/session";

chai.use(chaiHttp);

describe("POST /api/badge unauthenticated", () => {
    it("should not be able to post badge request if not connected", async () => {
        const res = await chai
            .request(app)
            .post(routes.API_POST_BADGE_REQUEST)
            .send({});

        res.should.have.status(401);
    });
});

describe("POST /api/badge authenticated", () => {
    let getToken;

    beforeEach(() => {
        getToken = sinon.stub(session, "getToken");
        getToken.returns(utils.getJWT("membre.actif"));
    });

    afterEach(() => {
        getToken.restore();
    });

    it("should be able to post badge request", async () => {
        const res = await chai
            .request(app)
            .post(routes.API_POST_BADGE_REQUEST)
            .set("content-type", "application/json")
            .send();
        res.should.have.status(200);
        const res2 = await chai
            .request(app)
            .post(routes.API_POST_BADGE_REQUEST)
            .set("content-type", "application/json")
            .send();
        res2.should.have.status(200);
        res2.body.dossier_number.should.equals(res.body.dossier_number);
    });
});

describe("POST /api/badge/status", () => {
    let getToken;

    beforeEach(() => {
        getToken = sinon.stub(session, "getToken");
        getToken.returns(utils.getJWT("membre.actif"));
    });

    afterEach(() => {
        getToken.restore();
    });

    it("should be able to update badge request", async () => {
        const res = await chai
            .request(app)
            .put(routes.API_UPDATE_BADGE_REQUEST_STATUS)
            .set("content-type", "application/json");
        res.should.have.status(200);
    });
});

describe("GET /api/account/badge page unauthenticated", () => {
    it("should not be able to get badge request page", (done) => {
        chai.request(app)
            .get(routes.ACCOUNT_GET_BADGE_REQUEST_PAGE_API)
            .redirects(0)
            .end((err, res) => {
                res.should.have.status(500);
                done();
            });
    });
});

describe("GET /api/account/badge page authenticated", () => {
    let getToken;

    beforeEach(() => {
        getToken = sinon.stub(session, "getToken");
        getToken.returns(utils.getJWT("membre.actif"));
    });

    afterEach(() => {
        getToken.restore();
    });

    it("should be able to get badge request page", (done) => {
        chai.request(app)
            .get(routes.ACCOUNT_GET_BADGE_REQUEST_PAGE_API)
            .redirects(0)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });

    it("should be able to get badge request page api", (done) => {
        chai.request(app)
            .get(routes.ACCOUNT_GET_BADGE_REQUEST_PAGE_API)
            .redirects(0)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });
});

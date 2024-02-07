import sinon from "sinon";
import chai from "chai";
import chaiHttp from "chai-http";

import app from "@/server/index";
import routes from "@/routes/routes";
import utils from "./utils";
import * as github from "@/lib/github";
import * as session from "@/server/helpers/session";

chai.use(chaiHttp);

describe("GET all opened pull requests unauthenticated", () => {
    it("should return an unauthorized error", async () => {
        let pullRequestStub = sinon.stub(github, "getPullRequests");
        pullRequestStub.returns(Promise.resolve([]));
        const res = await chai.request(app).get(routes.PULL_REQUEST_GET_PRS);
        res.should.have.status(500);
        pullRequestStub.called.should.be.false;
        pullRequestStub.restore();
    });

    it("should get pull requests when use is logged", async () => {
        const getToken = sinon.stub(session, "getToken");
        getToken.returns(utils.getJWT("membre.actif"));

        let pullRequestStub = sinon.stub(github, "getPullRequests");
        pullRequestStub.returns(Promise.resolve([]));
        const res = await chai.request(app).get(routes.PULL_REQUEST_GET_PRS);
        res.should.have.status(200);
        pullRequestStub.called.should.be.true;
        pullRequestStub.restore();
        getToken.restore();
    });
});

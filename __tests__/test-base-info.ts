import chai from "chai";
import chaiHttp from "chai-http";
import sinon from "sinon";

import * as session from "@/server/helpers/session";
import * as UpdateGithubFile from "@controllers/helpers/githubHelpers/updateGithubCollectionEntry";
import app from "@/server/index";
import routes from "@/routes/routes";
import utils from "./utils";

chai.use(chaiHttp);

describe("POST /api/public/account/base-info", () => {
    let updateStartupGithubFileStub;
    // let startupInfosStub
    beforeEach(() => {
        updateStartupGithubFileStub = sinon.stub(
            UpdateGithubFile,
            "updateAuthorGithubFile"
        );
        updateStartupGithubFileStub.returns(
            Promise.resolve({
                html_url: "https://djkajdlskjad.com",
                number: 12151,
            })
        );
    });

    afterEach(() => {
        updateStartupGithubFileStub.restore();
    });

    it("should be able to post public base info form", async () => {
        const res = await chai
            .request(app)
            .post(
                routes.API_PUBLIC_POST_BASE_INFO_FORM.replace(
                    ":username",
                    "membre.actif"
                )
            )
            .set("content-type", "application/json")
            .send({
                role: "Test",
                startups: ["a-plus"],
                previously: [],
                end: "2025-09-06",
            });
        res.should.have.status(401);
    });
    it("should be able to post public base info form if connected", async () => {
        const getToken = sinon.stub(session, "getToken");
        getToken.returns(utils.getJWT("membre.actif"));
        const res = await chai
            .request(app)
            .post(
                routes.API_PUBLIC_POST_BASE_INFO_FORM.replace(
                    ":username",
                    "membre.actif"
                )
            )
            .set("content-type", "application/json")
            .send({
                role: "Test",
                startups: ["a-plus"],
                previously: [],
                end: "2025-09-06",
            });
        res.should.have.status(200);
        getToken.restore();
    });
});

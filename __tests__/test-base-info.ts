import chai from "chai";
import chaiHttp from "chai-http";
import sinon from "sinon";

import * as session from "@/server/helpers/session";
import * as UpdateGithubFile from "@controllers/helpers/githubHelpers/updateGithubCollectionEntry";
import * as UpdateGithubCollectionEntry from "@controllers/helpers/githubHelpers/updateGithubCollectionEntry";

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

    it("should not be able to post public base info form if not connected", async () => {
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

describe("POST /api/account/base-info when not connected", () => {
    let updateGithubCollectionEntryStub;
    // let startupInfosStub
    beforeEach(() => {
        updateGithubCollectionEntryStub = sinon.stub(
            UpdateGithubCollectionEntry,
            "updateMultipleFilesPR"
        );
        updateGithubCollectionEntryStub.returns(
            Promise.resolve({
                html_url: "https://djkajdlskjad.com",
                number: 12151,
            })
        );
    });

    afterEach(() => {
        updateGithubCollectionEntryStub.restore();
    });
    it("should not be able to post base info form if not connected", async () => {
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
                bio: "Une super bio de plus de 15 caractères",
                fullname: "John Doe",
                domaine: "Développement",
                missions: [
                    {
                        start: "2019-09-06",
                        end: "2021-09-06",
                        employer: "Scopyleft",
                        status: "independent",
                        startups: ["a-plus"],
                    },
                    {
                        start: "2021-09-06",
                        end: "2025-09-06",
                        employer: "Scopyleft",
                        status: "independent",
                        startups: ["a-plus"],
                    },
                ],
                previously: ["a-plus"],
                end: "2025-09-06",
            });
        res.should.have.status(401);
    });
});
describe("POST /api/account/base-info when connected", () => {
    let updateGithubCollectionEntryStub;
    let getToken;
    // let startupInfosStub
    beforeEach(() => {
        updateGithubCollectionEntryStub = sinon.stub(
            UpdateGithubCollectionEntry,
            "updateMultipleFilesPR"
        );
        updateGithubCollectionEntryStub.returns(
            Promise.resolve({
                html_url: "https://djkajdlskjad.com",
                number: 12151,
            })
        );
        getToken = sinon.stub(session, "getToken");
        getToken.returns(utils.getJWT("membre.actif"));
    });

    afterEach(() => {
        updateGithubCollectionEntryStub.restore();
        getToken.restore();
    });

    it("should be able to post base info form if connected", async () => {
        const res = await chai
            .request(app)
            .post(
                routes.ACCOUNT_POST_BASE_INFO_FORM.replace(
                    ":username",
                    "membre.actif"
                )
            )
            .set("content-type", "application/json")
            .send({
                role: "Test",
                startups: ["a-plus"],
                bio: "Une super bio de plus de 15 caractères",
                fullname: "John Doe",
                domaine: "Développement",
                missions: [
                    {
                        start: "2019-09-06",
                        end: "2021-09-06",
                        employer: "Scopyleft",
                        status: "independent",
                        startups: ["a-plus"],
                    },
                    {
                        start: "2021-09-06",
                        end: "2025-09-06",
                        employer: "Scopyleft",
                        status: "independent",
                        startups: ["a-plus"],
                    },
                ],
                previously: ["a-plus"],
                end: "2025-09-06",
            });

        res.should.have.status(200);
    });
    it("should get an error message when field does not validate schema", async () => {
        const res = await chai
            .request(app)
            .post(
                routes.ACCOUNT_POST_BASE_INFO_FORM.replace(
                    ":username",
                    "membre.actif"
                )
            )
            .set("content-type", "application/json")
            .send({
                role: "Test",
                startups: ["a-plus"],
                bio: "Une super bio de",
                domaine: "Développement",
                missions: [
                    {
                        start: "2019-09-06",
                        end: "2021-09-06",
                        status: "independent",
                        startups: ["a-plus"],
                    },
                    {
                        start: "2021-09-06",
                        end: "2025-09-06",
                        employer: "Scopyleft",
                        startups: ["a-plus"],
                    },
                ],
                previously: ["a-plus"],
                end: "2025-09-06",
            });
        res.body.fieldErrors.fullname[0].should.equal("Le nom est obligatoire");
        res.body.fieldErrors.missions[0].should.equal("Précisez un employeur");
        res.body.fieldErrors.missions[1].should.equal("Le statut est requis");

        res.should.have.status(400);
    });
});

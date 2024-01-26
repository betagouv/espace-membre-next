import chai from "chai";
import chaiHttp from "chai-http";
import nock from "nock";
import utils from "./utils";
import { startServer } from "@/server";

chai.use(chaiHttp);
chai.should();

before(async () => {
    await utils.setupTestDatabase();
    await startServer().then(() => {
        console.log("DOne");
    });
});

beforeEach(() => {
    nock.disableNetConnect();
    nock.enableNetConnect("127.0.0.1");
    utils.mockUsers();
    utils.mockStartups();
    utils.mockStartupsDetails();
    utils.mockSlackGeneral();
    utils.mockSlackSecretariat();
    utils.mockOvhTime();
    utils.mockOvhUserResponder();
    utils.mockOvhUserEmailInfos();
    utils.mockOvhAllEmailInfos();
    utils.mockOvhRedirectionWithQueries();
    utils.mockOvhRedirections();
});

afterEach(() => {
    utils.cleanMocks();
    nock.enableNetConnect();
});

after(() => utils.cleanUpTestDatabase());

import "chai/register-should";
import nock from "nock";

import utils from "./utils";

before(async () => {
  await utils.setupTestDatabase();
});

beforeEach(() => {
  nock.disableNetConnect();
  nock.enableNetConnect("127.0.0.1");
});

afterEach(() => {
  utils.cleanMocks();
  nock.enableNetConnect();
});

after(() => utils.cleanUpTestDatabase());

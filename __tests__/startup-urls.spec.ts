import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { GET as getStartup } from "@/app/api/v1/startups/[id]/route";
import { db } from "@/lib/kysely";
import {
  getStartupUrls,
  replaceStartupUrls,
  setPrimaryStartupUrl,
} from "@/lib/kysely/queries/startupUrls";
import { startupUrlsSchema } from "@/models/startupUrl";

import {
  apiRequest,
  apiWriteRequest,
  createTestApiKey,
  deleteTestApiKey,
} from "./utils/apiKey";
import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const { PATCH: patchStartup } = proxyquire("@/app/api/v1/startups/[id]/route", {
  "next/cache": { revalidatePath: sinon.stub() },
}) as typeof import("@/app/api/v1/startups/[id]/route");
const { PATCH: patchStandards } = proxyquire(
  "@/app/api/v1/startups/[id]/standards/route",
  { "next/cache": { revalidatePath: sinon.stub() } },
) as typeof import("@/app/api/v1/startups/[id]/standards/route");

const GHID = "surls-startup";
const testData: FakeDataInterface = {
  incubators: [{ ghid: "surls-incub", title: "Liens" }],
  startups: [
    { ghid: GHID, name: "Produit aux liens", incubator: "surls-incub" },
  ],
  users: [],
};

type ApiStartup = {
  link: string | null;
  repository: string | null;
  urls: { type: string; label: string | null; url: string }[];
};

describe("startup_urls", () => {
  let startupUuid: string;
  let token: string;
  let keyUuid: string;

  const legacyColumns = () =>
    db
      .selectFrom("startups")
      .select(["link", "repository", "stats_url", "dashlord_url"])
      .where("uuid", "=", startupUuid)
      .executeTakeFirstOrThrow();

  const detail = async () => {
    const res = await getStartup(
      apiRequest(token, `http://localhost/api/v1/startups/${GHID}`),
      { params: Promise.resolve({ id: GHID }) },
    );
    expect(res.status).to.equal(200);
    return ((await res.json()) as { data: ApiStartup }).data;
  };

  before(async () => {
    await createData(testData);
    startupUuid = (
      await db
        .selectFrom("startups")
        .select("uuid")
        .where("ghid", "=", GHID)
        .executeTakeFirstOrThrow()
    ).uuid;
    const key = await createTestApiKey({
      scopes: ["startups:read", "startups:write"],
      write: { kind: "global" },
    });
    keyUuid = key.uuid;
    token = key.token;
  });

  after(async () => {
    await deleteTestApiKey(keyUuid);
    await db
      .deleteFrom("events")
      .where("action_on_startup", "=", startupUuid)
      .execute();
    await deleteData(testData);
  });

  beforeEach(async () => {
    await db
      .transaction()
      .execute((trx) => replaceStartupUrls(trx, startupUuid, []));
  });

  describe("replaceStartupUrls", () => {
    it("keeps the given order and mirrors the first link of each type", async () => {
      await db.transaction().execute((trx) =>
        replaceStartupUrls(trx, startupUuid, [
          { type: "repository", url: " https://git.example/front " },
          { type: "website", url: "https://produit.example" },
          { type: "repository", url: "https://git.example/back", label: "API" },
        ]),
      );

      expect(await getStartupUrls(startupUuid)).to.deep.equal([
        { type: "repository", label: null, url: "https://git.example/front" },
        { type: "website", label: null, url: "https://produit.example" },
        { type: "repository", label: "API", url: "https://git.example/back" },
      ]);
      const columns = await legacyColumns();
      expect(columns.link).to.equal("https://produit.example");
      expect(columns.repository).to.equal("https://git.example/front");
      expect(columns.stats_url).to.be.null;
    });

    it("clears the mirror when a type disappears", async () => {
      await db
        .transaction()
        .execute((trx) =>
          replaceStartupUrls(trx, startupUuid, [
            { type: "stats", url: "https://stats.example" },
          ]),
        );
      await db
        .transaction()
        .execute((trx) => replaceStartupUrls(trx, startupUuid, []));
      expect((await legacyColumns()).stats_url).to.be.null;
    });

    it("refuses a second link of a single type at the database level", async () => {
      let error: unknown;
      try {
        await db.transaction().execute((trx) =>
          replaceStartupUrls(trx, startupUuid, [
            { type: "dashlord", url: "https://a.example" },
            { type: "dashlord", url: "https://b.example" },
          ]),
        );
      } catch (e) {
        error = e;
      }
      expect(String(error)).to.contain("uniq_startup_urls_single_type");
    });
  });

  describe("setPrimaryStartupUrl", () => {
    beforeEach(async () => {
      await db.transaction().execute((trx) =>
        replaceStartupUrls(trx, startupUuid, [
          { type: "repository", url: "https://git.example/front" },
          { type: "repository", url: "https://git.example/back" },
        ]),
      );
    });

    it("replaces only the first link of the type", async () => {
      await db
        .transaction()
        .execute((trx) =>
          setPrimaryStartupUrl(trx, startupUuid, "repository", "https://new"),
        );
      expect(
        (await getStartupUrls(startupUuid)).map(({ url }) => url),
      ).to.deep.equal(["https://new", "https://git.example/back"]);
      expect((await legacyColumns()).repository).to.equal("https://new");
    });

    it("promotes the next link when the first one is removed", async () => {
      await db
        .transaction()
        .execute((trx) =>
          setPrimaryStartupUrl(trx, startupUuid, "repository", null),
        );
      expect(
        (await getStartupUrls(startupUuid)).map(({ url }) => url),
      ).to.deep.equal(["https://git.example/back"]);
      expect((await legacyColumns()).repository).to.equal(
        "https://git.example/back",
      );
    });

    it("drops the label of a link whose URL changes", async () => {
      await db
        .transaction()
        .execute((trx) =>
          replaceStartupUrls(trx, startupUuid, [
            { type: "website", url: "https://v1.example", label: "Ancienne" },
          ]),
        );
      await db
        .transaction()
        .execute((trx) =>
          setPrimaryStartupUrl(
            trx,
            startupUuid,
            "website",
            "https://v2.example",
          ),
        );
      const website = (await getStartupUrls(startupUuid)).find(
        ({ type }) => type === "website",
      );
      expect(website!.label).to.be.null;
    });

    it("appends a missing type after the existing links", async () => {
      await db
        .transaction()
        .execute((trx) =>
          setPrimaryStartupUrl(trx, startupUuid, "website", "https://site"),
        );
      expect(
        (await getStartupUrls(startupUuid)).map(({ type }) => type),
      ).to.deep.equal(["repository", "repository", "website"]);
    });
  });

  describe("api v1", () => {
    it("renders link, repository and urls from startup_urls", async () => {
      await db.transaction().execute((trx) =>
        replaceStartupUrls(trx, startupUuid, [
          { type: "demo", url: "https://demo.example", label: "Bac à sable" },
          { type: "website", url: "https://produit.example" },
        ]),
      );
      const startup = await detail();
      expect(startup.link).to.equal("https://produit.example");
      expect(startup.repository).to.be.null;
      expect(startup.urls).to.deep.equal([
        { type: "demo", label: "Bac à sable", url: "https://demo.example" },
        { type: "website", label: null, url: "https://produit.example" },
      ]);
    });

    it("writes link through the table without dropping the other websites", async () => {
      await db.transaction().execute((trx) =>
        replaceStartupUrls(trx, startupUuid, [
          { type: "website", url: "https://old.example" },
          { type: "website", url: "https://mirror.example" },
        ]),
      );
      const res = await patchStartup(
        apiWriteRequest(
          token,
          `http://localhost/api/v1/startups/${GHID}`,
          "PATCH",
          "application/merge-patch+json",
          { link: "https://new.example" },
        ),
        { params: Promise.resolve({ id: GHID }) },
      );
      expect(res.status).to.equal(200);
      const body = ((await res.json()) as { data: ApiStartup }).data;
      expect(body.link).to.equal("https://new.example");
      expect(body.urls.map(({ url }) => url)).to.deep.equal([
        "https://new.example",
        "https://mirror.example",
      ]);
      expect((await legacyColumns()).link).to.equal("https://new.example");
    });

    it("answers 422 on a javascript: link", async () => {
      const res = await patchStartup(
        apiWriteRequest(
          token,
          `http://localhost/api/v1/startups/${GHID}`,
          "PATCH",
          "application/merge-patch+json",
          { link: "javascript:alert(1)" },
        ),
        { params: Promise.resolve({ id: GHID }) },
      );
      expect(res.status).to.equal(422);
      expect(await getStartupUrls(startupUuid)).to.deep.equal([]);
    });

    it("writes the standards URLs through the table", async () => {
      const res = await patchStandards(
        apiWriteRequest(
          token,
          `http://localhost/api/v1/startups/${GHID}/standards`,
          "PATCH",
          "application/merge-patch+json",
          { dashlord_url: "https://dashlord.example", stats: true },
        ),
        { params: Promise.resolve({ id: GHID }) },
      );
      expect(res.status).to.equal(200);
      const body = (
        (await res.json()) as {
          data: { dashlord_url: string; stats: boolean; stats_url: null };
        }
      ).data;
      expect(body.dashlord_url).to.equal("https://dashlord.example");
      expect(body.stats).to.equal(true);
      expect(body.stats_url).to.be.null;
      expect(await getStartupUrls(startupUuid)).to.deep.equal([
        { type: "dashlord", label: null, url: "https://dashlord.example" },
      ]);
      expect((await legacyColumns()).dashlord_url).to.equal(
        "https://dashlord.example",
      );
    });
  });

  describe("startupUrlsSchema", () => {
    it("refuses two links of a single type", () => {
      const parsed = startupUrlsSchema.safeParse([
        { type: "budget", url: "https://a.example" },
        { type: "budget", url: "https://b.example" },
      ]);
      expect(parsed.success).to.equal(false);
      expect(parsed.error!.issues[0].path).to.deep.equal([1, "type"]);
    });

    it("accepts several links of a multiple type", () => {
      const parsed = startupUrlsSchema.safeParse([
        { type: "repository", url: "https://a.example" },
        { type: "repository", url: "https://b.example" },
      ]);
      expect(parsed.success).to.equal(true);
    });

    it("refuses a scheme hidden behind control characters", () => {
      for (const url of [
        "java\tscript:alert(1)",
        " javascript:alert(1)",
        "jav\nascript:alert(1)",
        "JaVaScRiPt:alert(1)",
        "file:///etc/passwd",
      ]) {
        expect(
          startupUrlsSchema.safeParse([{ type: "repository", url }]).success,
          JSON.stringify(url),
        ).to.equal(false);
      }
    });

    it("refuses a javascript: link", () => {
      const parsed = startupUrlsSchema.safeParse([
        { type: "website", url: "javascript:alert(1)" },
      ]);
      expect(parsed.success).to.equal(false);
    });

    it("requires an http(s) website, like the former link field", () => {
      const parsed = startupUrlsSchema.safeParse([
        { type: "website", url: "www.produit.example" },
      ]);
      expect(parsed.success).to.equal(false);
      expect(
        startupUrlsSchema.safeParse([
          { type: "repository", url: "git@git.example:produit.git" },
        ]).success,
        "les autres types gardent des chaines libres",
      ).to.equal(true);
    });

    it("bounds the impact link, mirrored into a varchar(255) column", () => {
      const parsed = startupUrlsSchema.safeParse([
        { type: "impact", url: `https://i.example/${"a".repeat(255)}` },
      ]);
      expect(parsed.success).to.equal(false);
    });

    it("bounds the links mirrored into a varchar(255) column", () => {
      const parsed = startupUrlsSchema.safeParse([
        { type: "ecodesign", url: `https://e.example/${"a".repeat(255)}` },
      ]);
      expect(parsed.success).to.equal(false);
    });
  });
});

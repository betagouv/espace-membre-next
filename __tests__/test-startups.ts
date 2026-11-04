import { randomUUID } from "crypto";
import * as nextAuth from "next-auth/next";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { createData, deleteData } from "./utils/fakeData";
import { testUsers } from "./utils/users-data";
import { db } from "@/lib/kysely";
import { SponsorDomaineMinisteriel, SponsorType } from "@/models/sponsor";
import { StartupPhase } from "@/models/startup";
import { AuthorizationError } from "@/lib/error";

describe("Test startup server action", () => {
  describe("post /api/startups/:startup unauthenticated", () => {
    let getServerSessionStub;
    let updateStartup;
    beforeEach(async () => {
      getServerSessionStub = sinon
        .stub(nextAuth, "getServerSession")
        .resolves({});

      await createData(testUsers);
      const mockSession = {
        user: {},
      };
      getServerSessionStub.resolves(mockSession);
    });
    afterEach(async () => {
      sinon.restore();
      await deleteData(testUsers);
    });
    it("should not allow unauthenticated user to update startups", async () => {
      const startup = await db
        .selectFrom("startups")
        .selectAll()
        .where("ghid", "=", "test-startup")
        .executeTakeFirstOrThrow();
      const cacheStub = {
        revalidatePath: sinon.stub(),
      };

      const actions = proxyquire("@/app/api/startups/actions", {
        "next/cache": cacheStub,
      });
      updateStartup = actions.updateStartup;
      console.log(startup);
      try {
        await updateStartup({
          formData: {
            startup: {
              contact: "",
              description: "",
              incubator_ids: [],
              name: "",
              pitch: "",
            },
            startupEvents: [],
            startupPhases: [],
            startupSponsors: [],
            newSponsors: [],
            newPhases: [],
          },
          startupUuid: startup.uuid,
        });
      } catch (error) {
        error.should.be.instanceof(AuthorizationError);
      }
    });
  });

  describe("post /api/startups/:startup authenticated", () => {
    let getServerSessionStub;
    let user;
    let startup;
    let updateStartup;
    beforeEach(async () => {
      getServerSessionStub = sinon
        .stub(nextAuth, "getServerSession")
        .resolves({});

      const cacheStub = {
        revalidatePath: sinon.stub(),
      };

      const actions = proxyquire("@/app/api/startups/actions", {
        "next/cache": cacheStub,
      });
      updateStartup = actions.updateStartup;
      await createData(testUsers);
      user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.actif")
        .executeTakeFirstOrThrow();
      // membre.actif est prestataire (aucun legal_status) en mission active sur
      // test-startup : il edite la fiche sans etre admin ni agent public.
      const mockSession = {
        user: {
          id: "membre.actif",
          isAdmin: false,
          uuid: user.uuid,
        },
      };
      startup = await db
        .selectFrom("startups")
        .selectAll()
        .where("ghid", "=", "test-startup")
        .executeTakeFirstOrThrow();
      const incubator = await db
        .selectFrom("incubators")
        .select("uuid")
        .executeTakeFirstOrThrow();
      // startups_principal_incubator_linked est differee : le principal et son
      // lien doivent atterrir dans la meme transaction.
      await db.transaction().execute(async (trx) => {
        await trx
          .updateTable("startups")
          .set({ incubator_id: incubator.uuid })
          .where("uuid", "=", startup.uuid)
          .execute();
        await trx
          .insertInto("startups_incubators")
          .values({ startup_id: startup.uuid, incubator_id: incubator.uuid })
          .execute();
      });
      getServerSessionStub.resolves(mockSession);
    });
    afterEach(async () => {
      sinon.restore();
      await db.deleteFrom("events").execute();

      await deleteData(testUsers);
    });

    it("should update product if date and phase are valid", async () => {
      await updateStartup({
        formData: {
          startup: {
            contact: "lamissiondelastartup@beta.gouv.fr",
            description: "la description de la startup de test",
            incubator_ids: [
              (
                await db
                  .selectFrom("incubators")
                  .selectAll()
                  .executeTakeFirstOrThrow()
              ).uuid,
            ],
            name: "title de la se",
            pitch: "lamissiondelastartup",
          },
          startupEvents: [],
          startupPhases: [
            {
              name: StartupPhase.PHASE_ABANDON,
              start: new Date(),
            },
          ],
          startupSponsors: [],
          newSponsors: [],
          newPhases: [],
        },
        startupUuid: startup.uuid,
      });
      const updatedStartup = await db
        .selectFrom("startups")
        .selectAll()
        .where("uuid", "=", startup.uuid)
        .executeTakeFirstOrThrow();
      updatedStartup.pitch?.should.equals("lamissiondelastartup");
      updatedStartup.name.should.equals("title de la se");
      updatedStartup.description?.should.equals(
        "la description de la startup de test",
      );
    });

    it("should refuse a member without mission on the product", async () => {
      const otherUser = await db
        .selectFrom("users")
        .select("uuid")
        .where("username", "=", "membre.parti")
        .executeTakeFirstOrThrow();
      getServerSessionStub.resolves({
        user: { id: "membre.parti", isAdmin: false, uuid: otherUser.uuid },
      });

      let error: unknown;
      try {
        await updateStartup({
          formData: {
            startup: {
              contact: "lamissiondelastartup@beta.gouv.fr",
              description: "la description de la startup de test",
              incubator_ids: [
                (
                  await db
                    .selectFrom("incubators")
                    .selectAll()
                    .executeTakeFirstOrThrow()
                ).uuid,
              ],
              name: "title de la se",
              pitch: "lamissiondelastartup",
            },
            startupEvents: [],
            startupPhases: [],
            startupSponsors: [],
            newSponsors: [],
            newPhases: [],
          },
          startupUuid: startup.uuid,
        });
      } catch (e) {
        error = e;
      }
      error!.should.be.instanceof(AuthorizationError);
    });

    it("should refuse an incubator change from a non-agent with a mission", async () => {
      let error: unknown;
      try {
        await updateStartup({
          formData: {
            startup: {
              contact: "lamissiondelastartup@beta.gouv.fr",
              description: "la description de la startup de test",
              incubator_ids: [randomUUID()],
              name: "title de la se",
              pitch: "lamissiondelastartup",
            },
            startupEvents: [],
            startupPhases: [],
            startupSponsors: [],
            newSponsors: [],
            newPhases: [],
          },
          startupUuid: startup.uuid,
        });
      } catch (e) {
        error = e;
      }
      error!.should.be.instanceof(AuthorizationError);
      const unchanged = await db
        .selectFrom("startups")
        .select("name")
        .where("uuid", "=", startup.uuid)
        .executeTakeFirstOrThrow();
      unchanged.name.should.equal("test-startup");
    });

    it("should keep member management closed to a non-agent with a mission", async () => {
      const actions = proxyquire("@/app/api/startups/actions", {
        "next/cache": { revalidatePath: sinon.stub() },
      });

      let error: unknown;
      try {
        await actions.addMember(startup.uuid, "membre.nouveau");
      } catch (e) {
        error = e;
      }
      error!.should.be.instanceof(AuthorizationError);
    });
  });

  describe("post /api/startups/:startup/create-form authenticated", () => {
    let getServerSessionStub;
    let user;
    let startup;
    let createStartup;
    beforeEach(async () => {
      getServerSessionStub = sinon
        .stub(nextAuth, "getServerSession")
        .resolves({});

      await createData(testUsers);
      const cacheStub = {
        revalidatePath: sinon.stub(),
      };

      const actions = proxyquire("@/app/api/startups/actions", {
        "next/cache": cacheStub,
      });
      createStartup = actions.createStartup;
      user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.actif")
        .executeTakeFirstOrThrow();
      const mockSession = {
        user: {
          id: "membre.actif",
          isAdmin: true,
          uuid: user.uuid,
        },
      };
      startup = await db
        .selectFrom("startups")
        .selectAll()
        .where("ghid", "=", "test-startup")
        .executeTakeFirstOrThrow();
      getServerSessionStub.resolves(mockSession);
    });
    afterEach(async () => {
      sinon.restore();
      await db.deleteFrom("events").execute();
      await db
        .deleteFrom("startups")
        .where("ghid", "=", "title-de-la-se")
        .execute();
      await deleteData(testUsers);
    });

    it("should create product if date and phase are valid", async () => {
      await createStartup({
        formData: {
          startup: {
            pitch: "lamissiondelastartup",
            description: "la description de la startup de test",
            name: "title de la se",
            contact: "lamissiondelastartup@beta.gouv.fr",
            incubator_ids: [
              (
                await db
                  .selectFrom("incubators")
                  .selectAll()
                  .executeTakeFirstOrThrow()
              ).uuid,
            ],
          },
          startupPhases: [
            {
              name: StartupPhase.PHASE_ABANDON,
              start: new Date(),
            },
          ],
          newSponsors: [
            {
              ghid: "asponsors",
              name: "a sponsors",
              acronym: "AS",
              type: SponsorType.SPONSOR_TYPE_OPERATEUR,
              domaine_ministeriel:
                SponsorDomaineMinisteriel.SPONSOR_DOMAINE_CULTURE,
            },
          ],
          startupEvents: [],
          startupSponsors: [],
          newPhases: [],
        },
      });
      const startups = await db
        .selectFrom("startups")
        .where("ghid", "=", "title-de-la-se")
        .selectAll()
        .execute();
      console.log(startups);
    });
  });
});

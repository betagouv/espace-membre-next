import { addMonths, format } from "date-fns";
import * as nextAuth from "next-auth/next";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { createData, deleteData } from "./utils/fakeData";
import { testUsers } from "./utils/users-data";
import { db } from "@/lib/kysely";

const userUuid = async (username: string) =>
  (
    await db
      .selectFrom("users")
      .select("uuid")
      .where("username", "=", username)
      .executeTakeFirstOrThrow()
  ).uuid;

const countMissions = async (userId: string) =>
  (
    await db
      .selectFrom("missions")
      .select("uuid")
      .where("user_id", "=", userId)
      .execute()
  ).length;

describe("safeUpdateMemberMissions authorization", () => {
  let getServerSessionStub: sinon.SinonStub;
  let safeUpdateMemberMissions;

  const loginAs = async (username: string, isAdmin = false) =>
    getServerSessionStub.resolves({
      user: { id: username, uuid: await userUuid(username), isAdmin },
    });

  const addMission = (memberUuid: string) =>
    safeUpdateMemberMissions({
      memberUuid,
      missions: [
        {
          start: new Date(),
          end: addMonths(new Date(), 3),
          status: "independent",
          employer: "octo",
          startups: [],
        },
      ],
    });

  beforeEach(async () => {
    getServerSessionStub = sinon.stub(nextAuth, "getServerSession");
    const actions = proxyquire("@/app/api/member/actions", {
      "next/cache": { revalidatePath: sinon.stub() },
    });
    safeUpdateMemberMissions = actions.safeUpdateMemberMissions;
    await createData(testUsers);
  });

  afterEach(async () => {
    sinon.restore();
    await deleteData(testUsers);
  });

  // membre.nouveau partage test-startup avec membre.actif, sans statut d'agent
  // public ni equipe d'incubateur : canEditMember est faux.
  it("should refuse a member writing the missions of an active member", async () => {
    await loginAs("membre.nouveau");
    const target = await userUuid("membre.actif");
    const before = await countMissions(target);

    const res = await addMission(target);

    res.success.should.equal(false);
    res.message.should.include("missions d'un membre actif");
    (await countMissions(target)).should.equal(before);
  });

  it("should let a member bring back an expired member", async () => {
    await loginAs("membre.nouveau");
    const target = await userUuid("membre.expire");
    const before = await countMissions(target);

    const res = await addMission(target);

    res.success.should.equal(true);
    (await countMissions(target)).should.equal(before + 1);
  });

  it("should let a member write their own missions", async () => {
    await loginAs("membre.actif");
    const self = await userUuid("membre.actif");
    const before = await countMissions(self);

    const res = await addMission(self);

    res.success.should.equal(true);
    (await countMissions(self)).should.equal(before + 1);
  });

  it("should treat a member as active on the last day of their mission", async () => {
    await loginAs("membre.nouveau");
    const target = await userUuid("membre.expire");
    await db
      .updateTable("missions")
      .set({ end: new Date() })
      .where("user_id", "=", target)
      .execute();
    const before = await countMissions(target);

    const res = await addMission(target);

    res.success.should.equal(false);
    (await countMissions(target)).should.equal(before);
  });

  describe("on an existing mission of an expired member", () => {
    const shortenedEnd = new Date("2017-10-01");

    const shortenMission = async () => {
      const target = await userUuid("membre.expire");
      const mission = await db
        .selectFrom("missions")
        .select(["uuid", "start"])
        .where("user_id", "=", target)
        .executeTakeFirstOrThrow();
      const res = await safeUpdateMemberMissions({
        memberUuid: target,
        missions: [
          {
            uuid: mission.uuid,
            start: mission.start,
            end: shortenedEnd,
            status: "independent",
            employer: "octo",
            startups: [],
          },
        ],
      });
      const { end } = await db
        .selectFrom("missions")
        .select("end")
        .where("uuid", "=", mission.uuid)
        .executeTakeFirstOrThrow();
      return { res, end: end && format(end, "yyyy-MM-dd") };
    };

    it("should refuse a member shortening it", async () => {
      await loginAs("membre.nouveau");

      const { res, end } = await shortenMission();

      res.success.should.equal(false);
      res.message.should.include("supérieure à la précédente");
      end!.should.equal("2017-11-02");
    });

    it("should let an admin shorten it", async () => {
      await loginAs("membre.nouveau", true);

      const { res, end } = await shortenMission();

      res.success.should.equal(true);
      end!.should.equal(format(shortenedEnd, "yyyy-MM-dd"));
    });
  });

  it("should let an admin write the missions of an active member", async () => {
    await loginAs("membre.nouveau", true);
    const target = await userUuid("membre.actif");
    const before = await countMissions(target);

    const res = await addMission(target);

    res.success.should.equal(true);
    (await countMissions(target)).should.equal(before + 1);
  });
});

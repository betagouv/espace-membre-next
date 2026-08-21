import { expect } from "chai";
import { addDays, subDays } from "date-fns";

import { db } from "@/lib/kysely";
import { getUserIncubators } from "@/lib/kysely/queries/users";

import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const now = new Date();

const testData: FakeDataInterface = {
  incubators: [
    { ghid: "ui-incub-a", title: "UI Incubateur A" },
    { ghid: "ui-incub-b", title: "UI Incubateur B" },
  ],
  startups: [
    {
      ghid: "ui-shared",
      name: "Produit co-incube",
      incubator: "ui-incub-a",
      incubators: ["ui-incub-b"],
    },
  ],
  users: [
    {
      username: "ui-member",
      role: "Developpeuse",
      missions: [
        {
          start: subDays(now, 30),
          end: addDays(now, 30),
          startups: ["ui-shared"],
        },
      ],
    },
  ],
};

describe("getUserIncubators", () => {
  before(async () => {
    await createData(testData);
  });

  after(async () => {
    await deleteData(testData);
  });

  /**
   * Ce test echoue sur le code d'avant ce lot : la deuxieme branche du `or`
   * passait par startups.incubator_id, donc ne rendait que l'incubateur
   * principal d'un produit co-incube.
   */
  it("returns BOTH incubators of a co-incubated product", async () => {
    const user = await db
      .selectFrom("users")
      .select("uuid")
      .where("username", "=", "ui-member")
      .executeTakeFirstOrThrow();

    const ghids = (await getUserIncubators(user.uuid))
      .map((incubator) => incubator.ghid)
      .sort();
    expect(ghids).to.deep.equal(["ui-incub-a", "ui-incub-b"]);
  });

  it("carries the ghid, which feeds PerimeterSelect", async () => {
    const user = await db
      .selectFrom("users")
      .select("uuid")
      .where("username", "=", "ui-member")
      .executeTakeFirstOrThrow();

    for (const incubator of await getUserIncubators(user.uuid)) {
      expect(incubator).to.include.keys(["uuid", "title", "ghid"]);
      expect(incubator.ghid).to.be.a("string");
    }
  });
});

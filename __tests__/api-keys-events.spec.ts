import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";
import * as nextAuth from "next-auth/next";

import { getEventListByUsername } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";

import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const { createPersonalApiKey } = proxyquire(
  "@/app/api/api-keys/actions/createPersonalApiKey",
  { "next/cache": { revalidatePath: sinon.stub() } },
) as typeof import("@/app/api/api-keys/actions/createPersonalApiKey");

const testData: FakeDataInterface = {
  incubators: [],
  startups: [],
  users: [
    { username: "akev-owner", fullname: "Porteuse de clef", missions: [] },
  ],
};

describe("api key creation events", () => {
  let ownerUuid: string;
  let sessionStub: sinon.SinonStub;

  before(async () => {
    await createData(testData);
    ownerUuid = (
      await db
        .selectFrom("users")
        .select("uuid")
        .where("username", "=", "akev-owner")
        .executeTakeFirstOrThrow()
    ).uuid;
    sessionStub = sinon.stub(nextAuth, "getServerSession").resolves({
      user: { id: "akev-owner", uuid: ownerUuid, isAdmin: false },
    } as never);
  });

  after(async () => {
    sessionStub.restore();
    await db
      .deleteFrom("api_keys")
      .where("owner_user_id", "=", ownerUuid)
      .execute();
    await db
      .deleteFrom("events")
      .where("action_on_username", "=", "akev-owner")
      .execute();
    await db
      .deleteFrom("events")
      .where("created_by_username", "=", "akev-owner")
      .execute();
    await deleteData(testData);
  });

  /**
   * L'historique d'un membre est lu par action_on_username, jamais par
   * created_by_username (getEventListByUsername). Sans ce champ, la creation
   * d'une clef personnelle n'apparaissait dans l'historique de personne, y
   * compris quand le porteur la creait lui-meme.
   */
  it("attaches API_KEY_CREATED to the owner of a personal key", async () => {
    const created = await createPersonalApiKey(
      {
        name: "Clef de la porteuse",
        kind: "personal",
        scopes: ["startups:read"],
        read_perimeter: { kind: "global" },
        write_perimeter: null,
        expires_at: null,
        owner_incubator_id: null,
      },
      ownerUuid,
    );
    expect(created.token).to.be.a("string");

    const history = await getEventListByUsername("akev-owner");
    const event = history.find(
      (entry) => entry.action_code === EventCode.API_KEY_CREATED,
    );

    expect(event, "la creation n'apparait dans l'historique d'aucun membre").to
      .exist;
    expect(event!.created_by_username).to.equal("akev-owner");
    expect(event!.action_metadata.key_uuid).to.equal(created.uuid);
    expect(event!.action_metadata.kind).to.equal("personal");
  });
});

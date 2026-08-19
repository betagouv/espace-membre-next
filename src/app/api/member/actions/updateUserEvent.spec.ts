import { expect } from "chai";
import { Selectable } from "kysely";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { updateUserEvent } from "./updateUserEvent";
import { Users } from "@/@types/db";
import { db } from "@/lib/kysely";
import { AuthorizationError, BusinessError } from "@/lib/error";
import { createData, deleteData } from "__tests__/utils/fakeData";
import {
  memberJulienD,
  membreActif,
  testUsers,
} from "__tests__/utils/users-data";

// Un item de checklist ordinaire, auto-déclaratif.
const FIELD_ID = "onboarding-valeurs-beta";
// L'item marqué `restricted: true` dans onboarding.yml.
const RESTRICTED_FIELD_ID = "onboarding-atelier-onboarding";

describe("Update user event server action", () => {
  let getServerSessionStub, updateUserEventHandler: typeof updateUserEvent;
  let canValidateRestrictedStub: sinon.SinonStub;
  let user: Selectable<Users>;

  beforeEach(async () => {
    getServerSessionStub = sinon.stub();
    canValidateRestrictedStub = sinon.stub().resolves(false);
    await createData(testUsers);

    // Use proxyquire to replace bossClient module
    updateUserEventHandler = proxyquire(
      "@/app/api/member/actions/updateUserEvent",
      {
        "next-auth/next": { getServerSession: getServerSessionStub },
        "next/cache": { revalidatePath: sinon.stub().resolves() },
        "@/lib/canValidateRestrictedChecklistItem": {
          canValidateRestrictedChecklistItem: canValidateRestrictedStub,
          "@noCallThru": true,
        },
      },
    ).updateUserEvent as typeof updateUserEvent;
    user = await db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", membreActif.username)
      .executeTakeFirstOrThrow();
  });

  afterEach(async () => {
    await deleteData(testUsers);
    await db.deleteFrom("user_events").execute();
  });

  it("should add new event or update it if value is true", async () => {
    const mockSession = {
      user: {
        id: membreActif.username,
        isAdmin: false,
        uuid: user.uuid,
      },
    };
    getServerSessionStub.resolves(mockSession);
    await updateUserEventHandler({
      value: true,
      action_on_user_id: user.uuid,
      field_id: FIELD_ID,
    });
  });
  it("should delete event if it exist if value is true", async () => {
    const mockSession = {
      user: {
        id: membreActif.username,
        isAdmin: false,
        uuid: user.uuid,
      },
    };
    getServerSessionStub.resolves(mockSession);
    const userEvent = await db
      .insertInto("user_events")
      .values({
        user_id: user.uuid,
        date: new Date(),
        field_id: FIELD_ID,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await updateUserEventHandler({
      value: false,
      action_on_user_id: user.uuid,
      field_id: FIELD_ID,
    });
    const event = await db
      .selectFrom("user_events")
      .where("uuid", "=", userEvent.uuid)
      .executeTakeFirst();
    expect(event).to.be.undefined;
  });

  it("should add new event or update it if value is true when user isAdmin", async () => {
    const mockSession = {
      user: {
        id: membreActif.username,
        isAdmin: true,
        uuid: user.uuid,
      },
    };
    getServerSessionStub.resolves(mockSession);
    const otherUser = await db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", memberJulienD.username)
      .executeTakeFirstOrThrow();
    await updateUserEventHandler({
      value: true,
      action_on_user_id: otherUser.uuid,
      field_id: FIELD_ID,
    });
    const event = await db
      .selectFrom("user_events")
      .where("user_id", "=", otherUser.uuid)
      .where("field_id", "=", FIELD_ID)
      .executeTakeFirstOrThrow();
    event.should.be.exist;
  });

  it("should update event if event already exist", async () => {
    const mockSession = {
      user: {
        id: membreActif.username,
        isAdmin: false,
        uuid: user.uuid,
      },
    };
    getServerSessionStub.resolves(mockSession);
    const today = new Date();
    const userEvent = await db
      .insertInto("user_events")
      .values({
        user_id: user.uuid,
        date: new Date(),
        field_id: FIELD_ID,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await updateUserEventHandler({
      value: true,
      action_on_user_id: user.uuid,
      field_id: FIELD_ID,
      date: today,
    });
    const event = await db
      .selectFrom("user_events")
      .selectAll()
      .where("uuid", "=", userEvent.uuid)
      .executeTakeFirstOrThrow();
    event.should.be.exist;
    expect(event.date?.getTime()).to.be.equals(today.getTime());
  });

  it("should delete event if it exist if value is true when user isAdmin", async () => {
    const mockSession = {
      user: {
        id: membreActif.username,
        isAdmin: true,
        uuid: user.uuid,
      },
    };
    getServerSessionStub.resolves(mockSession);
    const otherUser = await db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", memberJulienD.username)
      .executeTakeFirstOrThrow();
    const userEvent = await db
      .insertInto("user_events")
      .values({
        user_id: otherUser.uuid,
        date: new Date(),
        field_id: FIELD_ID,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await updateUserEventHandler({
      value: false,
      action_on_user_id: otherUser.uuid,
      field_id: FIELD_ID,
    });
    const event = await db
      .selectFrom("user_events")
      .where("uuid", "=", userEvent.uuid)
      .executeTakeFirst();
    expect(event).to.be.undefined;
  });

  it("should throw AuthorizationError when a non-admin tries to delete another user's event", async () => {
    const otherUser = await db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", memberJulienD.username)
      .executeTakeFirstOrThrow();
    const userEvent = await db
      .insertInto("user_events")
      .values({
        user_id: otherUser.uuid,
        date: new Date(),
        field_id: FIELD_ID,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    const mockSession = {
      user: {
        id: membreActif.username,
        isAdmin: false,
        uuid: user.uuid,
      },
    };
    getServerSessionStub.resolves(mockSession);

    let thrown: unknown;
    try {
      await updateUserEventHandler({
        value: false,
        action_on_user_id: otherUser.uuid,
        field_id: FIELD_ID,
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).to.be.instanceOf(AuthorizationError);

    // Event must NOT have been deleted.
    const event = await db
      .selectFrom("user_events")
      .where("uuid", "=", userEvent.uuid)
      .executeTakeFirst();
    expect(event).to.not.be.undefined;
  });

  it("should throw AuthorizationError when a non-admin tries to create an event for another user", async () => {
    const mockSession = {
      user: {
        id: membreActif.username,
        isAdmin: false,
        uuid: user.uuid,
      },
    };
    getServerSessionStub.resolves(mockSession);
    const otherUser = await db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", memberJulienD.username)
      .executeTakeFirstOrThrow();

    let thrown: unknown;
    try {
      await updateUserEventHandler({
        value: true,
        action_on_user_id: otherUser.uuid,
        field_id: FIELD_ID,
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).to.be.instanceOf(AuthorizationError);

    // Event must NOT have been created.
    const event = await db
      .selectFrom("user_events")
      .where("user_id", "=", otherUser.uuid)
      .where("field_id", "=", FIELD_ID)
      .executeTakeFirst();
    expect(event).to.be.undefined;
  });

  it("should throw AuthorizationError when there is no session", async () => {
    getServerSessionStub.resolves(null);

    let thrown: unknown;
    try {
      await updateUserEventHandler({
        value: true,
        action_on_user_id: user.uuid,
        field_id: FIELD_ID,
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).to.be.instanceOf(AuthorizationError);
  });

  it("should throw BusinessError when the field_id is not a real checklist item", async () => {
    getServerSessionStub.resolves({
      user: { id: membreActif.username, isAdmin: false, uuid: user.uuid },
    });

    let thrown: unknown;
    try {
      await updateUserEventHandler({
        value: true,
        action_on_user_id: user.uuid,
        field_id: "a-field-id",
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).to.be.instanceOf(BusinessError);

    const event = await db
      .selectFrom("user_events")
      .where("user_id", "=", user.uuid)
      .where("field_id", "=", "a-field-id")
      .executeTakeFirst();
    expect(event).to.be.undefined;
  });

  it("should throw BusinessError when the field_id is a disabled checklist item", async () => {
    // onboarding-fiche-membre est `disabled` + `defaultValue` : il est deja
    // compte par l'offset de computeProgress, une ligne en base le compterait
    // une seconde fois et permettrait d'atteindre 100% sans l'atelier.
    getServerSessionStub.resolves({
      user: { id: membreActif.username, isAdmin: false, uuid: user.uuid },
    });

    let thrown: unknown;
    try {
      await updateUserEventHandler({
        value: true,
        action_on_user_id: user.uuid,
        field_id: "onboarding-fiche-membre",
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).to.be.instanceOf(BusinessError);
  });

  it("should throw AuthorizationError when a member checks a restricted item on themselves", async () => {
    canValidateRestrictedStub.resolves(false);
    getServerSessionStub.resolves({
      user: { id: membreActif.username, isAdmin: false, uuid: user.uuid },
    });

    let thrown: unknown;
    try {
      await updateUserEventHandler({
        value: true,
        action_on_user_id: user.uuid,
        field_id: RESTRICTED_FIELD_ID,
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).to.be.instanceOf(AuthorizationError);

    const event = await db
      .selectFrom("user_events")
      .where("user_id", "=", user.uuid)
      .where("field_id", "=", RESTRICTED_FIELD_ID)
      .executeTakeFirst();
    expect(event).to.be.undefined;
  });

  it("should throw AuthorizationError when a member unchecks a restricted item on themselves", async () => {
    canValidateRestrictedStub.resolves(false);
    const userEvent = await db
      .insertInto("user_events")
      .values({
        user_id: user.uuid,
        date: new Date(),
        field_id: RESTRICTED_FIELD_ID,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    getServerSessionStub.resolves({
      user: { id: membreActif.username, isAdmin: false, uuid: user.uuid },
    });

    let thrown: unknown;
    try {
      await updateUserEventHandler({
        value: false,
        action_on_user_id: user.uuid,
        field_id: RESTRICTED_FIELD_ID,
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).to.be.instanceOf(AuthorizationError);

    // L'evenement ne doit PAS avoir ete supprime.
    const event = await db
      .selectFrom("user_events")
      .where("uuid", "=", userEvent.uuid)
      .executeTakeFirst();
    expect(event).to.not.be.undefined;
  });

  it("should let the animation team check a restricted item for a member it cannot otherwise edit", async () => {
    canValidateRestrictedStub.resolves(true);
    getServerSessionStub.resolves({
      user: { id: membreActif.username, isAdmin: false, uuid: user.uuid },
    });
    const otherUser = await db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", memberJulienD.username)
      .executeTakeFirstOrThrow();

    await updateUserEventHandler({
      value: true,
      action_on_user_id: otherUser.uuid,
      field_id: RESTRICTED_FIELD_ID,
    });

    const event = await db
      .selectFrom("user_events")
      .where("user_id", "=", otherUser.uuid)
      .where("field_id", "=", RESTRICTED_FIELD_ID)
      .executeTakeFirst();
    expect(event).to.not.be.undefined;
  });

  it("should not let the animation team edit a non restricted item of a member it cannot edit", async () => {
    canValidateRestrictedStub.resolves(true);
    getServerSessionStub.resolves({
      user: { id: membreActif.username, isAdmin: false, uuid: user.uuid },
    });
    const otherUser = await db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", memberJulienD.username)
      .executeTakeFirstOrThrow();

    let thrown: unknown;
    try {
      await updateUserEventHandler({
        value: true,
        action_on_user_id: otherUser.uuid,
        field_id: FIELD_ID,
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).to.be.instanceOf(AuthorizationError);
  });
});

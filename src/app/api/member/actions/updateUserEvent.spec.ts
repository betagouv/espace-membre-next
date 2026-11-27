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
// L'item qui propose « non concerné » dans onboarding.yml.
const NOT_CONCERNED_FIELD_ID = "onboarding-forum-beta";

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
  describe("non concerné", () => {
    const selfSession = () => ({
      user: { id: membreActif.username, isAdmin: false, uuid: user.uuid },
    });
    const getEvent = (field_id = NOT_CONCERNED_FIELD_ID) =>
      db
        .selectFrom("user_events")
        .selectAll()
        .where("user_id", "=", user.uuid)
        .where("field_id", "=", field_id)
        .executeTakeFirst();
    const callAndCatch = async (params) => {
      try {
        await updateUserEventHandler(params);
      } catch (e) {
        return e;
      }
      return undefined;
    };

    it("should save the reason and the comment of a not concerned item", async () => {
      getServerSessionStub.resolves(selfSession());
      await updateUserEventHandler({
        value: true,
        action_on_user_id: user.uuid,
        field_id: NOT_CONCERNED_FIELD_ID,
        not_concerned: {
          reason: "ancien-membre",
          comment: "  Déjà venu en 2023  ",
        },
      });

      const event = await getEvent();
      expect(event?.not_concerned_reason).to.equal("ancien-membre");
      expect(event?.not_concerned_comment).to.equal("Déjà venu en 2023");
    });

    it("should store no comment when it is empty", async () => {
      getServerSessionStub.resolves(selfSession());
      await updateUserEventHandler({
        value: true,
        action_on_user_id: user.uuid,
        field_id: NOT_CONCERNED_FIELD_ID,
        not_concerned: { reason: "hors-marche-produit", comment: "   " },
      });

      const event = await getEvent();
      expect(event?.not_concerned_reason).to.equal("hors-marche-produit");
      expect(event?.not_concerned_comment).to.be.null;
    });

    it("should clear the reason when the item is then checked as done", async () => {
      getServerSessionStub.resolves(selfSession());
      await updateUserEventHandler({
        value: true,
        action_on_user_id: user.uuid,
        field_id: NOT_CONCERNED_FIELD_ID,
        not_concerned: { reason: "autre", comment: "Congé parental" },
      });
      await updateUserEventHandler({
        value: true,
        action_on_user_id: user.uuid,
        field_id: NOT_CONCERNED_FIELD_ID,
      });

      const event = await getEvent();
      expect(event).to.not.be.undefined;
      expect(event?.not_concerned_reason).to.be.null;
      expect(event?.not_concerned_comment).to.be.null;
    });

    it("should delete the not concerned declaration when the item is unchecked", async () => {
      getServerSessionStub.resolves(selfSession());
      await updateUserEventHandler({
        value: true,
        action_on_user_id: user.uuid,
        field_id: NOT_CONCERNED_FIELD_ID,
        not_concerned: { reason: "incubateur-non-concerne" },
      });
      await updateUserEventHandler({
        value: false,
        action_on_user_id: user.uuid,
        field_id: NOT_CONCERNED_FIELD_ID,
      });

      expect(await getEvent()).to.be.undefined;
    });

    it("should require a comment for the « autre » reason", async () => {
      getServerSessionStub.resolves(selfSession());
      const thrown = await callAndCatch({
        value: true,
        action_on_user_id: user.uuid,
        field_id: NOT_CONCERNED_FIELD_ID,
        not_concerned: { reason: "autre", comment: " " },
      });
      expect(thrown).to.be.instanceOf(BusinessError);
      expect(await getEvent()).to.be.undefined;
    });

    it("should reject a reason that is not in the checklist", async () => {
      getServerSessionStub.resolves(selfSession());
      const thrown = await callAndCatch({
        value: true,
        action_on_user_id: user.uuid,
        field_id: NOT_CONCERNED_FIELD_ID,
        not_concerned: { reason: "flemme" },
      });
      expect(thrown).to.be.instanceOf(BusinessError);
      expect(await getEvent()).to.be.undefined;
    });

    it("should reject a too long comment", async () => {
      getServerSessionStub.resolves(selfSession());
      const thrown = await callAndCatch({
        value: true,
        action_on_user_id: user.uuid,
        field_id: NOT_CONCERNED_FIELD_ID,
        not_concerned: { reason: "autre", comment: "a".repeat(501) },
      });
      expect(thrown).to.be.instanceOf(BusinessError);
      expect(await getEvent()).to.be.undefined;
    });

    it("should reject a not concerned declaration on an item that does not offer it", async () => {
      getServerSessionStub.resolves(selfSession());
      const thrown = await callAndCatch({
        value: true,
        action_on_user_id: user.uuid,
        field_id: FIELD_ID,
        not_concerned: { reason: "ancien-membre" },
      });
      expect(thrown).to.be.instanceOf(BusinessError);
      expect(await getEvent(FIELD_ID)).to.be.undefined;
    });

    it("should reject a not concerned declaration on an unchecked item", async () => {
      getServerSessionStub.resolves(selfSession());
      const thrown = await callAndCatch({
        value: false,
        action_on_user_id: user.uuid,
        field_id: NOT_CONCERNED_FIELD_ID,
        not_concerned: { reason: "ancien-membre" },
      });
      expect(thrown).to.be.instanceOf(BusinessError);
    });

    it("should not let a member declare another member not concerned", async () => {
      const otherUser = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", memberJulienD.username)
        .executeTakeFirstOrThrow();
      getServerSessionStub.resolves(selfSession());
      const thrown = await callAndCatch({
        value: true,
        action_on_user_id: otherUser.uuid,
        field_id: NOT_CONCERNED_FIELD_ID,
        not_concerned: { reason: "ancien-membre" },
      });
      expect(thrown).to.be.instanceOf(AuthorizationError);
      const event = await db
        .selectFrom("user_events")
        .selectAll()
        .where("user_id", "=", otherUser.uuid)
        .executeTakeFirst();
      expect(event).to.be.undefined;
    });
  });
});

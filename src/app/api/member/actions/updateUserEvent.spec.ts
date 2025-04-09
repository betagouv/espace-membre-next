import { expect } from "chai";
import { Selectable } from "kysely";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { updateUserEvent } from "./updateUserEvent";
import { Users } from "@/@types/db";
import { db } from "@/lib/kysely";
import { AuthorizationError } from "@/utils/error";
import { createData, deleteData } from "__tests__/utils/fakeData";
import {
    memberJulienD,
    membreActif,
    testUsers,
} from "__tests__/utils/users-data";

describe("Update user event server action", () => {
    let getServerSessionStub, updateUserEventHandler: typeof updateUserEvent;
    let user: Selectable<Users>;

    beforeEach(async () => {
        getServerSessionStub = sinon.stub();
        await createData(testUsers);

        // Use proxyquire to replace bossClient module
        updateUserEventHandler = proxyquire(
            "@/app/api/member/actions/updateUserEvent",
            {
                "next-auth/next": { getServerSession: getServerSessionStub },
                "next/cache": { revalidatePath: sinon.stub().resolves() },
            }
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
            field_id: "a-field-id",
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
                field_id: "a-field-id",
            })
            .returningAll()
            .executeTakeFirstOrThrow();
        await updateUserEventHandler({
            value: false,
            action_on_user_id: user.uuid,
            field_id: "a-field-id",
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
            field_id: "a-field-id",
        });
        const event = await db
            .selectFrom("user_events")
            .where("user_id", "=", otherUser.uuid)
            .where("field_id", "=", "a-field-id")
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
                field_id: "a-field-id",
            })
            .returningAll()
            .executeTakeFirstOrThrow();
        await updateUserEventHandler({
            value: true,
            action_on_user_id: user.uuid,
            field_id: "a-field-id",
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
                field_id: "a-field-id",
            })
            .returningAll()
            .executeTakeFirstOrThrow();

        await updateUserEventHandler({
            value: false,
            action_on_user_id: otherUser.uuid,
            field_id: "a-field-id",
        });
        const event = await db
            .selectFrom("user_events")
            .where("uuid", "=", userEvent.uuid)
            .executeTakeFirst();
        expect(event).to.be.undefined;
    });

    it("should delete event if it exist if value is false when user is not current user", async () => {
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
                field_id: "a-field-id",
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

        await updateUserEventHandler({
            value: false,
            action_on_user_id: otherUser.uuid,
            field_id: "a-field-id",
        });

        const event = await db
            .selectFrom("user_events")
            .where("uuid", "=", userEvent.uuid)
            .executeTakeFirst();
        expect(event).to.be.undefined;
    });

    it("should create event if value is true when user is not current user", async () => {
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
        await updateUserEventHandler({
            value: true,
            action_on_user_id: otherUser.uuid,
            field_id: "a-field-id",
        });

        const event = await db
            .selectFrom("user_events")
            .where("user_id", "=", otherUser.uuid)
            .where("field_id", "=", "a-field-id")
            .executeTakeFirstOrThrow();
        event.should.be.exist;
    });
});

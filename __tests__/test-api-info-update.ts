import { add } from "date-fns";
import { Selectable } from "kysely";
import { createMocks } from "node-mocks-http";
import proxyquire from "proxyquire";
import sinon from "sinon";

import utils from "./utils";
import { testUsers } from "./utils/users-data";
import { Startups } from "@/@types/db";
import { db } from "@/lib/kysely";
import { Status } from "@/models/mission";

let user = {
    fullname: "John Doe", // Replace with a valid string
    role: "Developer", // Replace with a valid string
    missions: [
        {
            start: new Date(),
            end: add(new Date(), { days: 30 }),
            status: Status.independent,
            employer: "Scopyleft",
        },
    ], // Replace with a valid array
    domaine: "Développement", // Replace with a valid string from the specified list
};

describe("PUT /api/member[username]/info-update", () => {
    let getServerSessionStub;
    let PUT;
    let startup: Selectable<Startups>;
    beforeEach(async () => {
        getServerSessionStub = sinon.stub();
        PUT = proxyquire("@/app/api/member/[username]/info-update/route", {
            "next-auth": { getServerSession: getServerSessionStub },
        }).PUT;
        await utils.createData(testUsers);
        startup = await db
            .insertInto("startups")
            .values({
                name: "un super startup",
                ghid: "un-super-startup",
            })
            .returningAll()
            .executeTakeFirstOrThrow();
    });

    afterEach(async () => {
        sinon.restore();
        await utils.deleteData(testUsers);
        await db
            .deleteFrom("startups")
            .where("uuid", "=", startup.uuid)
            .execute();
    });

    it("should return error if user is not authorized", async () => {
        const mockSession = {
            user: { id: "anyuser", isAdmin: false, uuid: "anyuser-uuid" },
        };
        getServerSessionStub.resolves(mockSession);
        const { req } = createMocks({
            method: "PUT",
            json: async () => ({
                ...user,
                missions: [
                    {
                        ...user.missions[0],
                        startups: [startup.uuid],
                    },
                ],
            }),
        });

        const res = await PUT(req, {
            params: { username: "valid.member" },
        });

        res.status.should.equals(403);
    });

    it("should return ok if updated user is current user", async () => {
        const mockSession = {
            user: {
                id: "membre.actif",
                isAdmin: false,
                uuid: "membre.actif-uuid",
            },
        };
        getServerSessionStub.resolves(mockSession);
        const { req } = createMocks({
            method: "PUT",
            query: {
                id: "1",
            },
            json: async () => ({
                ...user,
                missions: [
                    {
                        ...user.missions[0],
                        startups: [startup.uuid],
                    },
                ],
            }),
        });

        const res = await PUT(req, {
            params: { username: "membre.actif" },
        });

        res.status.should.equals(200);
    });

    it("should return ok if user making the action is admin", async () => {
        const mockSession = {
            user: {
                id: "lucas.charrier",
                isAdmin: true,
                uuid: "lucas.charrier-uuid",
            },
        };
        getServerSessionStub.resolves(mockSession);
        const { req } = createMocks({
            method: "PUT",
            query: {
                id: "1",
            },
            json: async () => ({
                ...user,
                missions: [
                    {
                        ...user.missions[0],
                        startups: [startup.uuid],
                    },
                ],
            }),
        });

        const res = await PUT(req, {
            params: { username: "membre.actif" },
        });

        res.status.should.equals(200);
    });

    it("should return 404 if user to change is unknown", async () => {
        const mockSession = {
            user: {
                id: "lucas.charrier",
                isAdmin: true,
                uuid: "lucas.charrier-uuid",
            },
        };
        getServerSessionStub.resolves(mockSession);
        const { req } = createMocks({
            method: "PUT",
            query: {
                id: "1",
            },
            json: async () => ({
                ...user,
                missions: [
                    {
                        ...user.missions[0],
                        startups: [startup.uuid],
                    },
                ],
            }),
        });

        const res: Response = await PUT(req, {
            params: { username: "a-user-that-do-not-exist" },
        });

        res.status.should.equals(404);
    });
});

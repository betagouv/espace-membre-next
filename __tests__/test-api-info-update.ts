import { add } from "date-fns";
import { createMocks } from "node-mocks-http";
import proxyquire from "proxyquire";
import sinon from "sinon";

import testUsers from "./users.json";
import utils from "./utils";
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
    beforeEach(async () => {
        getServerSessionStub = sinon.stub();
        PUT = proxyquire("@/app/api/member/[username]/info-update/route", {
            "next-auth": { getServerSession: getServerSessionStub },
        }).PUT;
        await utils.createUsers(testUsers);
    });

    afterEach(async () => {
        sinon.restore();
        await utils.deleteUsers(testUsers);
    });

    it("should return error if user is not authorized", async () => {
        const mockSession = {
            user: { id: "anyuser", isAdmin: false, uuid: "anyuser-uuid" },
        };
        getServerSessionStub.resolves(mockSession);
        const { req } = createMocks({
            method: "PUT",
            query: {
                id: "1",
            },
            json: async () => ({
                ...user,
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
            json: async () => user,
        });

        const res: Response = await PUT(req, {
            params: { username: "a-user-that-do-not-exist" },
        });

        res.status.should.equals(404);
    });
});

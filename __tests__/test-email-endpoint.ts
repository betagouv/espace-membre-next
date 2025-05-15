import chai from "chai";

import { memberJulienD, membreActif, membreNouveau, newMemberInStartupA, testUsers } from "./utils/users-data";
import utils from "./utils";
import proxyquire from "proxyquire";
import sinon from "sinon";
import { db, sql } from "@/lib/kysely";
import { GET as getEmail } from "@/app/api/protected/emails/route";
import { createMocks } from "node-mocks-http";
import { NextRequest } from "next/server";
import { buildBetaEmail, buildExtBetaEmail } from "@/server/controllers/utils";
import { EmailStatusCode } from "@/models/member";

const expect = chai.expect;

describe("Email endpoint", () => {
    let getServerSessionStub
    let getEmailsHandler: typeof getEmail
    beforeEach(async () => {
        getServerSessionStub = sinon.stub();
        await utils.createData(testUsers);
        getEmailsHandler = proxyquire("@/app/api/protected/emails/route", {
            "next-auth": { getServerSession: getServerSessionStub },
            "next/cache": { revalidatePath: sinon.stub().resolves() },
            '@/server/config/emailProviderService': {
                createEmailProviderService: () => ({
                    listMailbox: async () => {
                        return Promise.resolve([{
                            email: buildBetaEmail(membreActif.username)
                        }])
                    }
                })
            },
            '@/server/betagouv': {
                __esModule: true,
                default: {
                    getAllEmailInfos: async () => {
                        console.log('LCS GET BETAGOUV')
                        return Promise.resolve([
                            memberJulienD.username,
                            membreActif.username
                        ])
                    }
                },
            }
        }).GET;
    });

    afterEach(async () => {
        // clock.restore();
        await utils.deleteData(testUsers);
    });
    it("Should get all emails from ovh and not already existing emails", async () => {
        await db.updateTable('users').set({
            primary_email_status: EmailStatusCode.EMAIL_CREATION_WAITING,
            secondary_email: sql<string>`lower(concat(fullname, '@gmail.com'))`
        }).where('username', 'in', [
            membreActif.username,
            membreNouveau.username
        ]).execute()
        const res = await db.updateTable('users').set({
            primary_email_status: EmailStatusCode.EMAIL_ACTIVE_AND_CREATION_WAITING_AT_OPI,
            secondary_email: sql<string>`lower(concat(fullname, '@gmail.com'))`
        }).where('username', 'in', [
            memberJulienD.username
        ]).execute()
        console.log(res)
        const { req } = createMocks({
            method: "PUT",
            json: async () => ({
            }),
        });
        // Julien D already exists in ovh but does not exist in Open Exchange => should be return, and have alias
        // Membre Actif already exists in ovh and in Open Exchange => should be return by api
        // membreNouveau does not exist anywhere should be return by api should not have alias
        const resp = await getEmailsHandler(req as unknown as NextRequest)
        const emailObjList = await resp.json()
        emailObjList.length.should.equal(2)
        emailObjList.find(emailObj => emailObj.email === buildExtBetaEmail(memberJulienD.username)).should.exist
        emailObjList.find(emailObj => emailObj.email === buildExtBetaEmail(memberJulienD.username)).alias.should.equals(buildBetaEmail(memberJulienD.username))
        expect(emailObjList.find(emailObj => emailObj.email === buildExtBetaEmail(membreNouveau.username)).alias).equal(null)
    })
})
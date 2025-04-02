import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import { format } from "date-fns/format";
import nock from "nock";
import proxyquire from "proxyquire";
import rewire from "rewire";
import sinon from "sinon";

import testUsers from "./users.json";
import utilsTest from "./utils";
import { db } from "@/lib/kysely";
import { EmailStatusCode } from "@/models/member";
import * as email from "@/server/config/email.config";
import betagouv from "@betagouv";

chai.use(chaiHttp);

const emailScheduler = rewire("@schedulers/emailScheduler");

describe("getUnregisteredOVHUsers", () => {
    beforeEach(async () => {
        utilsTest.cleanMocks();
        utilsTest.mockOvhTime();
    });

    it("should not use expired accounts", async () => {
        utilsTest.mockUsers();
        const expiredMember = testUsers.find(
            (user) => user.id === "membre.expire"
        );
        const getValidUsers = emailScheduler.__get__("getValidUsers");
        const result = await getValidUsers(testUsers);

        chai.should().not.exist(result.find((x) => x.id === expiredMember.id));
    });
});

describe("Reinit password for expired users", () => {
    const datePassed = new Date();
    datePassed.setDate(datePassed.getDate() - 5);
    const formatedDate = format(datePassed, "yyyy-MM-dd");
    const users = [
        {
            id: "membre.actif",
            fullname: "membre actif",
            role: "Chargé de déploiement",
            start: "2020-09-01",
            end: "2090-01-30",
            employer: "admin/",
        },
        {
            id: "membre.expire",
            fullname: "membre expire",
            role: "Intrapreneur",
            start: "2018-01-01",
            end: `${formatedDate}`,
            employer: "admin/",
        },
    ];

    beforeEach(async () => {
        utilsTest.cleanMocks();
        utilsTest.mockOvhTime();
    });
    before(async () => {
        await utilsTest.createUsers(users);
        utilsTest.mockUsers();
        utilsTest.mockOvhTime();
        utilsTest.mockOvhRedirections();
        utilsTest.mockOvhUserResponder();
    });
    after(async () => {
        await utilsTest.deleteUsers(users);
    });
    it("should call once ovh api to change password", async () => {
        const url = process.env.USERS_API || "https://beta.gouv.fr"; // can't replace with config.usersApi ?
        // nock(url)
        //     .get((uri) => uri.includes("authors.json"))
        //     .reply(200, users)
        //     .persist();
        nock(/.*ovh.com/)
            .get(/^.*email\/domain\/.*\/account\/(.*)/)
            .reply(200, {
                accountName: "membre.expire",
                email: `membre.expire@betagouv.ovh`,
            });
        await db
            .updateTable("users")
            .where("username", "=", "membre.expire")
            .set({
                primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
            })
            .execute();
        const funcCalled = sinon.spy(betagouv, "changePassword");
        utilsTest.mockOvhChangePassword();
        await emailScheduler.reinitPasswordEmail();
        const dbUsers = await db
            .selectFrom("users")
            .selectAll()
            .where("username", "=", "membre.expire")
            .execute();
        dbUsers.length.should.be.equal(1);
        dbUsers[0].primary_email_status.should.be.equal(
            EmailStatusCode.EMAIL_SUSPENDED
        );
        funcCalled.calledOnce;
    });
});

describe("Set email active", () => {
    let sendEmailStub;
    let smtpBlockedContactsEmailDelete;
    let users = [
        {
            id: "membre.nouveau",
            fullname: "membre.nouveau",
            role: "Chargé de déploiement",
            start: "2020-09-01",
            end: "2090-01-30",
            employer: "admin/",
            secondary_email: `membre.nouveau@gmail.com`,
        },
    ];
    beforeEach(async () => {
        sendEmailStub = sinon
            .stub(email, "sendEmail")
            .returns(Promise.resolve(null));
        smtpBlockedContactsEmailDelete = sinon
            .stub(email, "smtpBlockedContactsEmailDelete")
            .returns(Promise.resolve(null));
        utilsTest.cleanMocks();
        utilsTest.mockOvhTime();
        await utilsTest.createUsers(users);
    });

    afterEach(async () => {
        sendEmailStub.restore();
        smtpBlockedContactsEmailDelete.restore();
        await utilsTest.deleteUsers(users);
    });

    it("should set status to EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING and sendEmailCreatedEmail if status is EMAIL_CRATION_PENDING", async () => {
        const now = new Date();
        const nowLess10Minutes = now.getTime() - 11 * 60 * 1000;
        await db
            .updateTable("users")
            .where("username", "=", "membre.nouveau")
            .set({
                primary_email_status: EmailStatusCode.EMAIL_UNSET,
                primary_email_status_updated_at: new Date(now),
            })
            .execute();
        await emailScheduler.setEmailAddressesActive();
        let users = await db
            .selectFrom("users")
            .selectAll()
            .where("username", "=", "membre.nouveau")
            .where(
                "primary_email_status",
                "=",
                EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING
            )
            .execute();
        users.length.should.be.equal(0);
        await db
            .updateTable("users")
            .where("username", "=", "membre.nouveau")
            .set({
                primary_email_status: EmailStatusCode.EMAIL_CREATION_PENDING,
                primary_email_status_updated_at: new Date(nowLess10Minutes),
            })
            .execute();
        await emailScheduler.setEmailAddressesActive();
        users = await db
            .selectFrom("users")
            .selectAll()
            .where("username", "=", "membre.nouveau")
            .where(
                "primary_email_status",
                "=",
                EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING
            )
            .execute();
        users[0].username.should.be.equal("membre.nouveau");
        sendEmailStub.calledOnce.should.be.true;
        smtpBlockedContactsEmailDelete.calledOnce.should.be.true;
        await db
            .updateTable("users")
            .where("username", "=", "membre.nouveau")
            .set({
                primary_email_status: EmailStatusCode.EMAIL_UNSET,
                primary_email_status_updated_at: new Date(now),
            })
            .execute();
    });

    // it("should set status to EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING and if status is EMAIL_RECREATION_PENDING", async () => {
    //     const url = process.env.USERS_API || "https://beta.gouv.fr"; // can't replace with config.usersApi ?
    //     nock(url)
    //         .get((uri) => uri.includes("authors.json"))
    //         .reply(200, [
    //             {
    //                 id: "membre.nouveau",
    //                 fullname: "membre.nouveau",
    //                 role: "Chargé de déploiement",
    //                 start: "2020-09-01",
    //                 end: "2090-01-30",
    //                 employer: "admin/",
    //             },
    //         ])
    //         .persist();

    //     const now = new Date();
    //     const nowLess10Minutes = now.getTime() - 11 * 60 * 1000;
    //     await knex("users")
    //         .where({
    //             username: "membre.nouveau",
    //         })
    //         .update({
    //             primary_email_status: EmailStatusCode.EMAIL_UNSET,
    //             primary_email_status_updated_at: new Date(now),
    //         });
    //     await emailScheduler.setEmailAddressesActive();
    //     let users = await knex("users")
    //         .where({
    //             username: "membre.nouveau",
    //             primary_email_status:
    //                 EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING,
    //         })
    //         .returning("*");
    //     users.length.should.be.equal(0);
    //     await knex("users")
    //         .where({
    //             username: "membre.nouveau",
    //         })
    //         .update({
    //             primary_email_status: EmailStatusCode.EMAIL_RECREATION_PENDING,
    //             primary_email_status_updated_at: new Date(nowLess10Minutes),
    //         });
    //     await emailScheduler.setEmailAddressesActive();
    //     users = await knex("users")
    //         .where({
    //             username: "membre.nouveau",
    //             primary_email_status: EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING,
    //         })
    //         .returning("*");
    //     sendEmailStub.calledOnce.should.be.true;
    //     smtpBlockedContactsEmailDelete.calledOnce.should.be.true;
    //     users[0].username.should.be.equal("membre.nouveau");
    //     await knex("users")
    //         .where({
    //             username: "membre.nouveau",
    //         })
    //         .update({
    //             primary_email_status: EmailStatusCode.EMAIL_UNSET,
    //             primary_email_status_updated_at: new Date(now),
    //         });
    // });
});

describe("Set email redirection active", () => {
    let smtpBlockedContactsEmailDelete;
    const users = [
        {
            id: "membre.nouveau",
            fullname: "membre.nouveau",
            role: "Chargé de déploiement",
            start: "2020-09-01",
            end: "2090-01-30",
            employer: "admin/",
            secondary_email: "membre.nouveau@gmail.com",
        },
    ];
    beforeEach(async () => {
        smtpBlockedContactsEmailDelete = sinon
            .stub(email, "smtpBlockedContactsEmailDelete")
            .returns(Promise.resolve(null));
        utilsTest.cleanMocks();
        utilsTest.mockOvhTime();
        await utilsTest.createUsers(users);
    });

    afterEach(async () => {
        smtpBlockedContactsEmailDelete.restore();
        await utilsTest.deleteUsers(users);
    });

    it("should set status to EMAIL_REDIRECTION_ACTIVE and sendEmailCreatedEmail if status is EMAIL_REDIRECTION_PENDING", async () => {
        // const url = process.env.USERS_API || "https://beta.gouv.fr"; // can't replace with config.usersApi ?
        // nock(url)
        //     .get((uri) => uri.includes("authors.json"))
        //     .reply(200, )
        //     .persist();

        const now = new Date();
        const nowLess10Minutes = now.getTime() - 11 * 60 * 1000;
        await db
            .updateTable("users")
            .where("username", "=", "membre.nouveau")
            .set({
                primary_email_status: EmailStatusCode.EMAIL_UNSET,
                primary_email_status_updated_at: new Date(now),
            })
            .execute();
        await emailScheduler.setCreatedEmailRedirectionsActive();
        let users = await db
            .selectFrom("users")
            .where("username", "=", "membre.nouveau")
            .where(
                "primary_email_status",
                "=",
                EmailStatusCode.EMAIL_REDIRECTION_ACTIVE
            )
            .selectAll()
            .execute();
        users.length.should.be.equal(0);
        await db
            .updateTable("users")
            .where("username", "=", "membre.nouveau")
            .set({
                primary_email_status: EmailStatusCode.EMAIL_REDIRECTION_PENDING,
                email_is_redirection: true,
                primary_email_status_updated_at: new Date(nowLess10Minutes),
            })
            .execute();
        await emailScheduler.setCreatedEmailRedirectionsActive();
        users = await db
            .selectFrom("users")
            .selectAll()
            .where("username", "=", "membre.nouveau")
            .where(
                "primary_email_status",
                "=",
                EmailStatusCode.EMAIL_REDIRECTION_ACTIVE
            )
            .execute();
        users[0].username.should.be.equal("membre.nouveau");
        smtpBlockedContactsEmailDelete.calledOnce.should.be.true;
        await db
            .updateTable("users")
            .where("username", "=", "membre.nouveau")
            .set({
                email_is_redirection: false,
                primary_email_status: EmailStatusCode.EMAIL_UNSET,
                primary_email_status_updated_at: new Date(now),
            })
            .execute();
    });
});

describe('Should send email validation', () => {
    let sendEmailStub;
    let sendOnboardingVerificationPendingEmail
    const users = [
        {
            id: "membre.nouveau",
            fullname: "membre.nouveau",
            role: "Chargé de déploiement",
            start: "2020-09-01",
            end: "2090-01-30",
            employer: "admin/",
            secondary_email: "membre.nouveau@gmail.com",
        },
    ];
     beforeEach(async () => {
        sendEmailStub = sinon.stub().resolves();
            sendOnboardingVerificationPendingEmail = proxyquire(
            "@/server/schedulers/emailScheduler",
            {
                "@/server/config/email.config": {
                    sendEmail: sendEmailStub,
                },
            }
        ).sendOnboardingVerificationPendingEmail;
        await utilsTest.createUsers(users);
    });

    afterEach(async () => {
        await utilsTest.deleteUsers(users);
    });

    it("should send onboarding verification pending email to users with EMAIL_VERIFICATION_WAITING status", async () => {
        await db.updateTable('users').set({
            'primary_email_status': EmailStatusCode.EMAIL_VERIFICATION_WAITING
        }).execute()
       
        await sendOnboardingVerificationPendingEmail()
        const token = await db.selectFrom('verification_tokens').selectAll().where('identifier', '=', 'membre.nouveau@gmail.com').executeTakeFirstOrThrow()
        expect(token).to.exist
    })
})

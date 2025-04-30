import chai from "chai";
import sinon from "sinon";

import testUsers from "./users.json";
import htmlBuilder from "../src/server/modules/htmlbuilder/htmlbuilder";
import * as mdtohtml from "@/lib/mdtohtml";
import { incubatorSchemaType } from "@/models/incubator";
import { Job } from "@/models/job";
import { Domaine, memberBaseInfoSchemaType } from "@/models/member";
import { userStartupSchemaType } from "@/models/startup";
import {
    EmailUserShouldUpdateInfo,
    EMAIL_TYPES,
} from "@modules/email";
import { memberJulienD } from "./utils/users-data";
chai.should();


describe("Test EMAIL_MATTERMOST_ACCOUNT_CREATED", () => {
    it("email EMAIL_MATTERMOST_ACCOUNT_CREATED", async () => {
        const resetPasswordLink = "https://mattermost-reset-link";
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_MATTERMOST_ACCOUNT_CREATED,
            variables: {
                resetPasswordLink,
                fullname: "Jean Polochon",
                email: "jean.polochon@beta.gouv.fr",
            },
        });

        emailBody.should.include(resetPasswordLink);
    });
});

describe("Test EMAIL_ENDING_CONTRACT", () => {
    it("email EMAIL_ENDING_CONTRACT_2_DAYS", async () => {
        const job: Job = {
            id: "test",
            url: "http://urldejob",
            domaine: Domaine.ANIMATION,
            title: "Un job",
        } as unknown as Job;
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_ENDING_CONTRACT_2_DAYS,
            variables: {
                endDate: new Date('2024-11-12'),
                user: {
                    userInfos: testUsers.find(
                        (user) => user.id === "julien.dauphant"
                    ) as unknown as memberBaseInfoSchemaType,
                    mattermostUsername: "julien.dauphant",
                },
                jobs: [job],
                days: 2,
            },
        });
        emailBody.should.include(job.url);
        emailBody.should.include(`Bonjour Julien Dauphant`);
        emailBody.should.include("prévu pour dans 2 jours");
        emailBody.should.include("le 12 novembre 2024");
    });

    it("email EMAIL_ENDING_CONTRACT_15_DAYS", async () => {
        const job: Job = {
            id: "test",
            url: "http://urldejob",
            domaine: Domaine.ANIMATION,
            title: "Un job",
        } as unknown as Job;
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_ENDING_CONTRACT_15_DAYS,
            variables: {
                endDate: new Date('2024-11-12'),
                user: {
                    userInfos: testUsers.find(
                        (user) => user.id === "julien.dauphant"
                    ) as unknown as memberBaseInfoSchemaType,
                    mattermostUsername: "julien.dauphant",
                },
                jobs: [job],
                days: 15,
            },
        });
        emailBody.should.include(job.url);
        emailBody.should.include("le 12 novembre 2024");
        emailBody.should.include(`Bonjour Julien Dauphant`);
        emailBody.should.include("Un petit mot pour te rappeler");
    });

    it("email EMAIL_ENDING_CONTRACT_30_DAYS", async () => {
        const job: Job = {
            id: "test",
            url: "http://urldejob",
            domaine: Domaine.ANIMATION,
            title: "Un job",
        } as unknown as Job;
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_ENDING_CONTRACT_30_DAYS,
            variables: {
                endDate: new Date('2024-11-12'),
                user: {
                    userInfos: testUsers.find(
                        (user) => user.id === "julien.dauphant"
                    ) as unknown as memberBaseInfoSchemaType,
                    mattermostUsername: "julien.dauphant",
                },
                jobs: [job],
                days: 30,
            },
        });
        emailBody.should.include("12 novembre 2024");
        emailBody.should.include(`Bonjour Julien Dauphant`);
        emailBody.should.include(
            "Un petit rappel concernant ta fiche membre chez beta.gouv.fr"
        );
        emailBody.should.include(job.url);
    });
});

describe("Test EMAIL_NO_MORE_CONTRACT", () => {
    it("email EMAIL_NO_MORE_CONTRACT_1_DAY", async () => {
        const user: memberBaseInfoSchemaType = memberJulienD as unknown as memberBaseInfoSchemaType;
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_1_DAY,
            variables: {
                user,
            },
        });
        emailBody.should.include(user.fullname);
        emailBody.should.include("Un petit mot pour te rappeler");
    });

    it("email EMAIL_NO_MORE_CONTRACT_30_DAY", async () => {
        const user: memberBaseInfoSchemaType = memberJulienD as unknown as memberBaseInfoSchemaType;

        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_30_DAY,
            variables: {
                user,
            },
        });
        emailBody.should.include(user.fullname);
        emailBody.should.include("Un petit mot pour te rappeler");
    });
});

describe("Test EMAIL_USER_SHOULD_UPDATE_INFO", () => {
    it("email EMAIL_USER_SHOULD_UPDATE_INFO", async () => {
        const renderHtmlFromMd = sinon.spy(mdtohtml, "renderHtmlFromMd");
        const user: EmailUserShouldUpdateInfo["variables"]["user"] = {
            fullname: "jean.paul",
            secondary_email: "paul@beta.gouv.fr",
            workplace_insee_code: "75012",
            tjm: "125 euros",
            gender: "Ne se prononce pas",
            startups: ["aide-jaune"],
            legal_status: "Auto-entreprise",
        } as EmailUserShouldUpdateInfo["variables"]["user"];
        const secretariatUrl: string = "http://secretariat-url";
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_USER_SHOULD_UPDATE_INFO,
            variables: {
                user,
                secretariatUrl,
            },
        });
        emailBody.should.include(user.fullname);
        emailBody.should.include(user.tjm);
        emailBody.should.include(user.gender);
        emailBody.should.include(user.legal_status);
        emailBody.should.include(user.startups[0]);
        emailBody.should.include(secretariatUrl);
        renderHtmlFromMd.called.should.be.true;
        renderHtmlFromMd.restore();
    });
});

describe(`Test EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE`, () => {
    it(`email EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE`, async () => {
        const startup = "Monsuivi";
        const title: string = await htmlBuilder.renderSubjectForType({
            type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE,
            variables: {
                startup,
            },
        });
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE,
            variables: {
                startup,
            },
        });
        emailBody.should.include(startup);
        title.should.include(startup);
    });
});

describe(`Test EMAIL_STARTUP_ENTER_ACCELERATION_PHASE`, () => {
    it(`email EMAIL_STARTUP_ENTER_ACCELERATION_PHASE`, async () => {
        const startup = "Monsuivi";
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_ACCELERATION_PHASE,
            variables: {
                startup,
            },
        });
        emailBody.should.include(startup);
    });
});

describe(`Test EMAIL_VERIFICATION_WAITING`, () => {
    it(`email EMAIL_VERIFICATION_WAITING`, async () => {
        const secretariatUrl: string = "http://secretariat-url";

        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_VERIFICATION_WAITING,
            variables: {
                secretariatUrl,
                secondaryEmail: "toto@gmail.com",
                fullname: "Lucas Thenet",
            },
        });
        emailBody.should.include(secretariatUrl);
    });
});

describe(`Test EMAIL_NEW_MEMBER_VALIDATION`, () => {
    it(`email EMAIL_NEW_MEMBER_VALIDATION`, async () => {
        const secretariatUrl: string = "http://secretariat-url";

        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_NEW_MEMBER_VALIDATION,
            variables: {
                validationLink: secretariatUrl,
                userInfos: {
                    fullname: "Jean Paul",
                } as memberBaseInfoSchemaType,
                startups: [
                    {
                        name: "Une startup",
                    } as userStartupSchemaType,
                ],
                incubator: {
                    title: "un super incubateur",
                } as incubatorSchemaType,
            },
        });
        emailBody.should.include(secretariatUrl);
    });
});

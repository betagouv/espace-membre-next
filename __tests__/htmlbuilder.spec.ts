import chai from "chai";
import sinon from "sinon";

import testUsers from "./users.json";
import htmlBuilder from "../src/server/modules/htmlbuilder/htmlbuilder";
import * as mdtohtml from "@/lib/mdtohtml";
import { Job } from "@/models/job";
import { Domaine, memberBaseInfoSchemaType } from "@/models/member";
import {
    EmailMarrainageNewcomer,
    EmailMarrainageOnboarder,
    EmailUserShouldUpdateInfo,
    EMAIL_TYPES,
} from "@modules/email";
chai.should();

describe("Test MARRAINAGE_REQUEST_EMAIL", async () => {
    it("should build MARRAINAGE_REQUEST_EMAIL", async () => {
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL,
            variables: {
                newcomer: testUsers.find(
                    (user) => user.id === "membre.actif"
                ) as unknown as memberBaseInfoSchemaType,
                onboarder: testUsers.find(
                    (user) => user.id === "julien.dauphant"
                ) as unknown as memberBaseInfoSchemaType,
                marrainageAcceptUrl: "http://adresse/marrainage/accept",
                marrainageDeclineUrl: "http://adresse/marrainage/decline",
                startup: "",
            },
        });
        const subject =
            htmlBuilder.subjects[EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL];
        emailBody.should.include("marrainage/accept");

        emailBody.should.include("marrainage/decline");
        subject.should.equal("Tu as été sélectionné·e comme marrain·e 🙌");
    });

    it("email MARRAINAGE_REQUEST_EMAIL should include position and startup when available", async () => {
        const newcomer = testUsers.find(
            (user) => user.id === "membre.actif"
        ) as unknown as memberBaseInfoSchemaType;
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL,
            variables: {
                newcomer: newcomer,
                onboarder: testUsers.find(
                    (user) => user.id === "julien.dauphant"
                ) as unknown as memberBaseInfoSchemaType,
                marrainageAcceptUrl: "http://adresse/marrainage/accept",
                marrainageDeclineUrl: "http://adresse/marrainage/decline",
                startup: "test-startup",
            },
        });
        emailBody.should.include(
            '(Chargé de déploiement chez <a href="https://beta.gouv.fr/startups/test-startup.html" target="_blank">test-startup</a>)'
        );
    });

    it("email MARRAINAGE_REQUEST_EMAIL should include role only when startup not available", async () => {
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL,
            variables: {
                newcomer: testUsers.find(
                    (user) => user.id === "membre.plusieurs.missions"
                ) as unknown as memberBaseInfoSchemaType,
                onboarder: testUsers.find(
                    (user) => user.id === "julien.dauphant"
                ) as unknown as memberBaseInfoSchemaType,
                marrainageAcceptUrl: "http://adresse/marrainage/accept",
                marrainageDeclineUrl: "http://adresse/marrainage/decline",
                startup: "",
            },
        });
        emailBody.should.include("(Chargé de déploiement)");
    });

    it("email MARRAINAGE_REQUEST_EMAIL should include startup only when role not available", async () => {
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL,
            variables: {
                newcomer: {
                    id: "membre.nouveau",
                    fullname: "Membre Nouveau",
                    domaine: "Animation",
                    startups: ["test-startup"],
                } as unknown as memberBaseInfoSchemaType,
                onboarder: testUsers.find(
                    (user) => user.id === "julien.dauphant"
                ) as unknown as memberBaseInfoSchemaType,
                marrainageAcceptUrl: "http://adresse/marrainage/accept",
                marrainageDeclineUrl: "http://adresse/marrainage/decline",
                startup: "test-startup",
            },
        });
        emailBody.should.include(
            '(récemment arrivé·e chez <a href="https://beta.gouv.fr/startups/test-startup.html" target="_blank">test-startup</a>)'
        );
    });
});

describe("Test MARRAINAGE_ACCEPT_ONBOARDER_EMAIL", async () => {
    it("email MARRAINAGE_ACCEPT_ONBOARDER_EMAIL", async () => {
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_ACCEPT_ONBOARDER_EMAIL,
            variables: {
                newcomer: testUsers.find(
                    (user) => user.id === "membre.nouveau"
                ) as unknown as memberBaseInfoSchemaType,
                onboarder: testUsers.find(
                    (user) => user.id === "julien.dauphant"
                ) as unknown as memberBaseInfoSchemaType,
            },
        });
        htmlBuilder.subjects[
            EMAIL_TYPES.MARRAINAGE_ACCEPT_ONBOARDER_EMAIL
        ].should.equal("Mise en contact 👋");
        emailBody.should.include("Tu as accepté de marrainer Membre Nouveau");
    });
});

describe("Test MARRAINAGE_ACCEPT_NEWCOMER_EMAIL", () => {
    it("email MARRAINAGE_ACCEPT_NEWCOMER_EMAIL", async () => {
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_ACCEPT_NEWCOMER_EMAIL,
            variables: {
                newcomer: testUsers.find(
                    (user) => user.id === "membre.nouveau"
                ) as unknown as memberBaseInfoSchemaType,
                onboarder: testUsers.find(
                    (user) => user.id === "membre.actif"
                ) as unknown as memberBaseInfoSchemaType,
            },
        });
        htmlBuilder.subjects[
            EMAIL_TYPES.MARRAINAGE_ACCEPT_NEWCOMER_EMAIL
        ].should.equal("Mise en contact 👋");
        emailBody.should.include("Membre Actif a accepté de te marrainer");
    });
});

describe("Test MARRAINAGE_REQUEST_FAILED", () => {
    it("email MARRAINAGE_REQUEST_FAILED", async () => {
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_REQUEST_FAILED,
            variables: {
                errorMessage: `Pas de parrain dispo`,
                userId: "mathilde.dupont",
            },
        });
        emailBody.should.include("Pas de parrain dispo");
    });
});

describe("Test ONBOARDING_REFERENT_EMAIL", () => {
    it("email ONBOARDING_REFERENT_EMAIL", async () => {
        const prUrl = "http://github.com/uneurl";
        const name = "Paul";
        const isEmailBetaAsked = false;
        const referent = "Lucas";
        const renderHtmlFromMd = sinon.spy(mdtohtml, "renderHtmlFromMd");
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.ONBOARDING_REFERENT_EMAIL,
            variables: {
                referent,
                prUrl,
                name,
                isEmailBetaAsked,
                isSentViaEmail: true,
            },
        });
        const emailSubject: string = await htmlBuilder.renderSubjectForType({
            type: EMAIL_TYPES.ONBOARDING_REFERENT_EMAIL,
            variables: {
                referent,
                prUrl,
                name,
                isEmailBetaAsked,
                isSentViaEmail: true,
            },
        });

        emailBody.should.include(prUrl);
        emailBody.should.include(name);
        emailSubject.should.equal(`${name} vient de créer sa fiche Github`);
        renderHtmlFromMd.called.should.be.true;
        renderHtmlFromMd.restore();
    });
});

describe("Test EMAIL_PR_PENDING", () => {
    it("email EMAIL_PR_PENDING", async () => {
        const pr_link = "http://github.com/uneurl";
        const username = "Paul";
        const renderHtmlFromMd = sinon.spy(mdtohtml, "renderHtmlFromMd");
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_PR_PENDING,
            variables: {
                username,
                pr_link,
            },
        });

        emailBody.should.include(username);
        emailBody.should.include(pr_link);
        renderHtmlFromMd.called.should.be.true;
        renderHtmlFromMd.restore();
    });
});

describe("Test EMAIL_MATTERMOST_ACCOUNT_CREATED", () => {
    it("email EMAIL_MATTERMOST_ACCOUNT_CREATED", async () => {
        const resetPasswordLink = "https://mattermost-reset-link";
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_MATTERMOST_ACCOUNT_CREATED,
            variables: {
                resetPasswordLink,
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
                endDate: "11/12/2024",
                user: {
                    userInfos: testUsers.find(
                        (user) => user.id === "julien.dauphant"
                    ) as unknown as memberBaseInfoSchemaType,
                    mattermostUsername: "julien.dauphant",
                },
                jobs: [job],
            },
        });
        emailBody.should.include(job.url);
        emailBody.should.include(`Bonjour Julien Dauphant`);
        emailBody.should.include("prévu pour dans 2 jours");
        emailBody.should.include("le 11/12/2024");
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
                endDate: "11/12/2024",
                user: {
                    userInfos: testUsers.find(
                        (user) => user.id === "julien.dauphant"
                    ) as unknown as memberBaseInfoSchemaType,
                    mattermostUsername: "julien.dauphant",
                },
                jobs: [job],
            },
        });
        emailBody.should.include(job.url);
        emailBody.should.include(`le 11/12/2024`);
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
                endDate: "11/12/2024",
                user: {
                    userInfos: testUsers.find(
                        (user) => user.id === "julien.dauphant"
                    ) as unknown as memberBaseInfoSchemaType,
                    mattermostUsername: "julien.dauphant",
                },
                jobs: [job],
            },
        });
        emailBody.should.include(`au 11/12/2024`);
        emailBody.should.include(`Bonjour Julien Dauphant`);
        emailBody.should.include("Un petit rappel concernant ta fiche membre chez beta.gouv.fr");
        emailBody.should.include(job.url);
    });
});

describe("Test EMAIL_NO_MORE_CONTRACT", () => {
    it("email EMAIL_NO_MORE_CONTRACT_1_DAY", async () => {
        const user: memberBaseInfoSchemaType = {
            username: "jean.paul",
            fullname: "Jean Paul",
        } as unknown as memberBaseInfoSchemaType;
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
        const user: memberBaseInfoSchemaType = {
            username: "jean.paul",
            fullname: "Jean Paul",
        } as unknown as memberBaseInfoSchemaType;
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

describe(`Test MARRAINAGE_NEWCOMER_EMAIL`, () => {
    it(`email MARRAINAGE_NEWCOMER_EMAIL`, async () => {
        const renderHtmlFromMd = sinon.spy(mdtohtml, "renderHtmlFromMd");
        const onboarder: EmailMarrainageNewcomer["variables"]["onboarder"] = {
            fullname: "Jean Paul",
        } as EmailMarrainageNewcomer["variables"]["onboarder"];
        const member: EmailMarrainageNewcomer["variables"]["member"] = {
            fullname: "Paul-Erick Tarantule",
        } as EmailMarrainageNewcomer["variables"]["member"];
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_NEWCOMER_EMAIL,
            variables: {
                member,
                onboarder,
            },
        });
        emailBody.should.include("Bonjour Paul-Erick");
        emailBody.should.include(`Jean Paul`);
        renderHtmlFromMd.called.should.be.true;
        renderHtmlFromMd.restore();
    });
});

describe(`Test MARRAINAGE_ONBOARDER_EMAIL`, () => {
    it(`email MARRAINAGE_ONBOARDER_EMAIL`, async () => {
        const renderHtmlFromMd = sinon.spy(mdtohtml, "renderHtmlFromMd");
        const member: EmailMarrainageOnboarder["variables"]["member"] = {
            fullname: "Paul-Erick Tarantule",
        } as EmailMarrainageOnboarder["variables"]["member"];
        const newcomers: EmailMarrainageOnboarder["variables"]["newcomers"] = [
            {
                fullname: "Jean Paul",
                email: "jean.paul@beta.gouv.fr",
                secondary_email: "",
            },
            {
                fullname: "Arnaud Lagarde",
                email: "arnaud.lagarde@gmail.com",
                secondary_email: "",
            },
        ] as EmailMarrainageOnboarder["variables"]["newcomers"];
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.MARRAINAGE_ONBOARDER_EMAIL,
            variables: {
                member,
                newcomers,
            },
        });
        emailBody.should.include(`Jean Paul`);
        emailBody.should.include(`Arnaud Lagarde`);
        renderHtmlFromMd.called.should.be.true;
        renderHtmlFromMd.restore();
    });
});

describe(`Test EMAIL_NEW_MEMBER_PR`, () => {
    it(`email EMAIL_NEW_MEMBER_PR`, async () => {
        const prUrl = "http://github.com/url";
        const startup = "Monsuivi";
        const name = "Jean Pauluchon";
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_NEW_MEMBER_PR,
            variables: {
                prUrl,
                name,
                isEmailBetaAsked: true,
                startup,
            },
        });

        emailBody.should.include(prUrl);
        emailBody.should.include(name);
        emailBody.should.include(startup);
    });
});

describe(`Test EMAIL_PR_PENDING_TO_TEAM`, () => {
    it(`email EMAIL_PR_PENDING_TO_TEAM,`, async () => {
        const pr_link = "http://github.com/url";
        const startup = "Monsuivi";
        const username = "jean.pauluchon";
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_PR_PENDING_TO_TEAM,
            variables: {
                pr_link,
                username,
                startup,
            },
        });

        emailBody.should.include(pr_link);
        emailBody.should.include(username);
        emailBody.should.include(startup);
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

describe(`Test EMAIL_NEWSLETTER`, () => {
    it(`email EMAIL_NEWSLETTER`, async () => {
        const renderHtmlFromMd = sinon.spy(mdtohtml, "renderHtmlFromMd");
        const emailBody: string = await htmlBuilder.renderContentForType({
            type: EMAIL_TYPES.EMAIL_NEWSLETTER,
            variables: {
                body: `# 📰 A ne pas rater chez beta.gouv.fr ! - Infolettre du __REMPLACER_PAR_DATE__
<!-- 
Envoi de l'infolettre, le jeudi à ***15h***.

Bonnes pratiques de rédaction : 
- Écrire du contenu concis et lisible
- Utiliser des phrases (avec une majuscule, un verbe et un point)
- Éviter les abréviations.

-->

Vous pouvez consulter cette infolettre [en ligne](__REMPLACER_PAR_LIEN_DU_PAD__).

[TOC]

## Nouveautés transverses

*Documentation : [Comment lancer ou participer à un sujet transverse](https://doc.incubateur.net/communaute/travailler-a-beta-gouv/actions-transverses)*

<!-- 
### Modèle d'une annonce transverse (Présenté par John Doe)

Ici un petit paragraphe de ce qui c'est passé. Par exemple, qu'un chocolat chaud a été servi à 20 personnes la semaine dernière. Tout le monde est content.

Et là, une invitation à une action : par exemple, répondre sur le Slack #domaine-chocolat.
-->


## Annonces des recrutements

*Votre mission prend bientôt fin? Retrouvez l'ensemble des offres sur https://beta.gouv.fr/recrutement/*

### Les offres de la semaine
__REMPLACER_PAR_OFFRES__

<!--
> ### Modèle d'expression d'un besoin de recrutement
> 
> Ici un petit texte pour présenter le poste qui vient de s'ouvrir
> 
> Et là, un lien vers l'annonce ou une personne à contacter.
-->

## 📅 Evénements à venir

*Par ordre chronologique*

<!--
> ### Modèle d'un événement, jour de la semaine date et heure
> 
> Ici un petit paragraphe sur l'événement.
> 
> Et là, un lien vers l'annonce de recrutement ou la personne à contacter.
-->



## Qui a écrit cette infolettre ? 

Cette infolettre est collaborative. Elle a été écrite par les membres de la communauté dont vous faites partie.

La prochaine sera envoyée jeudi prochain. Vous avez connaissance de news ou d'événements ?
Vous pouvez écrire la nouvelle infolettre dès maintenant en vous connectant au secretariat : https://secretariat.incubateur.net/newsletters

Vous avez raté les infolettres précédentes ? [vous pouvez les lire sur le secretariat](https://secretariat.incubateur.net/newsletters)

---
[Se désinscrire de l'infolettre]([[UNSUB_LINK_FR]])`,
                subject: `# 📰 A ne pas rater chez beta.gouv.fr ! - Infolettre du __REMPLACER_PAR_DATE__`,
            },
        });

        emailBody.should.include(`A ne pas rater chez beta.gouv.fr`);
        const emailTitle = await htmlBuilder.renderSubjectForType({
            type: EMAIL_TYPES.EMAIL_NEWSLETTER,
            variables: {
                subject: `# 📰 A ne pas rater chez beta.gouv.fr ! - Infolettre du __REMPLACER_PAR_DATE__`,
                body: "",
            },
        });
        emailTitle.should.include(`A ne pas rater chez beta.gouv.fr`);
        renderHtmlFromMd.called.should.be.true;
        renderHtmlFromMd.restore();
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
            },
        });
        emailBody.should.include(secretariatUrl);
    });
});

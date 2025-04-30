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

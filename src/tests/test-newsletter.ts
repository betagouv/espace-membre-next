import chai from "chai";
import chaiHttp from "chai-http";
import HedgedocApi from "hedgedoc-api";
import nock from "nock";
import rewire from "rewire";
import sinon from "sinon";
import BetaGouv from "@/betagouv";
import config from "@/config";
import * as controllerUtils from "@/controllers/utils";
import knex from "@/db";
import { renderHtmlFromMd } from "@/lib/mdtohtml";
import utils from "./utils";
import * as chat from "@/infra/chat";
import * as Email from "@/config/email.config";
import session from "next-auth";

chai.use(chaiHttp);
const app = "http://localhost:3000/";

const should = chai.should();

const {
    NUMBER_OF_DAY_IN_A_WEEK,
    NUMBER_OF_DAY_FROM_MONDAY,
    addDays,
    getMonday,
    formatDateToFrenchTextReadableFormat,
} = controllerUtils;

const NEWSLETTER_TITLE =
    "📰 A ne pas rater chez beta.gouv.fr ! - Infolettre du __REMPLACER_PAR_DATE__";
const NEWSLETTER_TEMPLATE_CONTENT = `# ${NEWSLETTER_TITLE}
  Vous pouvez consulter cette infolettre [en ligne](__REMPLACER_PAR_LIEN_DU_PAD__).
  ### Modèle d'annonce d'une Startup (Présenté par Jeanne Doe)
  ## Nouveautés transverses
  *Documentation : [Comment lancer ou participer à un sujet transverse](https://doc.incubateur.net/communaute/travailler-a-beta-gouv/actions-transverses)*
  ## Annonces des recrutements
  __REMPLACER_PAR_OFFRES__
  ## :calendar: Evénements à venir
  ### 👋 Prochain point hebdo beta.gouv, jeudi __REMPLACER_PAR_DATE_STAND_UP__ à 12h
`;

// const newsletterScheduler = rewire("../src/schedulers/newsletterScheduler");
// const replaceMacroInContent = newsletterScheduler.__get__(
//     "replaceMacroInContent"
// );
// const computeMessageReminder = newsletterScheduler.__get__(
//     "computeMessageReminder"
// );
// const newsletterReminder = newsletterScheduler.__get__("newsletterReminder");
// const sendNewsletterAndCreateNewOne = newsletterScheduler.__get__(
//     "sendNewsletterAndCreateNewOne"
// );
// const computeId = newsletterScheduler.__get__("computeId");

const mockNewsletters = [
    {
        validator: "julien.dauphant",
        url: `${config.padURL}/45a5dsdsqsdada`,
        sent_at: new Date("2021-02-11 00:00:00+00"),
        created_at: new Date("2021-02-11 00:00:00+00"),
        id: utils.randomUuid(),
    },
    {
        validator: "julien.dauphant",
        url: `${config.padURL}/54564q5484saw`,
        sent_at: new Date("2021-02-18 00:00:00+00"),
        created_at: new Date("2021-02-18 00:00:00+00"),
        id: utils.randomUuid(),
    },
    {
        validator: "julien.dauphant",
        url: `${config.padURL}/5456dsadsahjww`,
        sent_at: new Date("2021-02-25 00:00:00+00"),
        created_at: new Date("2021-02-25 00:00:00+00"),
        id: utils.randomUuid(),
    },
    {
        validator: "julien.dauphant",
        url: `${config.padURL}/54564qwsajsghd4rhjww`,
        sent_at: new Date("2021-03-04 00:00:00+00"),
        created_at: new Date("2021-03-04 00:00:00+00"),
        id: utils.randomUuid(),
    },
];

const mockNewsletter = {
    url: `${config.padURL}/rewir34984292342sad`,
    created_at: new Date("2021-04-04 00:00:00+00"),
    id: utils.randomUuid(),
};

describe("Newsletter", () => {
    let clock;

    describe("should get newsletter data for newsletter page", () => {
        let getToken;
        beforeEach(async () => {
            await knex("newsletters").insert([
                ...mockNewsletters,
                mockNewsletter,
            ]);
            getToken = sinon.stub(session, "getServerSession");
            getToken.returns({
                user: {
                    name: "membre.actif",
                },
            });
        });
        afterEach(async () => {
            await knex("newsletters").truncate();
            getToken.restore();
        });

        it("should get previous newsletters and current newsletter", (done) => {
            const date = new Date("2021-01-20T07:59:59+01:00");
            clock = sinon.useFakeTimers(date);
            chai.request(app)
                .get("/newsletters")
                .end((err, res) => {
                    res.text.should.include(`${config.padURL}/5456dsadsahjww`);
                    const allNewsletterButMostRecentOne =
                        mockNewsletters.filter((n) => !n.sent_at);
                    allNewsletterButMostRecentOne.forEach((newsletter) => {
                        res.text.should.include(
                            controllerUtils.formatDateToReadableDateAndTimeFormat(
                                newsletter.sent_at
                            )
                        );
                    });
                    const currentNewsletter = mockNewsletter;
                    res.text.should.include(
                        `<h3>Infolettre de la semaine du ${controllerUtils.formatDateToFrenchTextReadableFormat(
                            addDays(getMonday(currentNewsletter.created_at), 7)
                        )}</h3>`
                    );
                    clock.restore();
                    done();
                });
        });
    });

    describe("newsletter interface", () => {
        let getToken;
        beforeEach(async () => {
            getToken = sinon.stub(session, "getServerSession");
            getToken.returns({
                user: {
                    name: "membre.actif",
                },
            });
        });
        afterEach(async () => {
            getToken.restore();
        });
        it("should validate newsletter", async () => {
            await knex("newsletters").insert([
                {
                    ...mockNewsletter,
                },
            ]);
            const date = new Date("2021-03-05T07:59:59+01:00");
            clock = sinon.useFakeTimers(date);
            await chai.request(app).get("/validateNewsletter");
            const newsletter = await knex("newsletters")
                .where({ id: mockNewsletter.id })
                .first();
            newsletter.validator.should.equal("membre.actif");
            await knex("newsletters").truncate();
            clock.restore();
        });

        it("should cancel newsletter", async () => {
            await knex("newsletters").insert([
                {
                    ...mockNewsletter,
                    validator: "membre.actif",
                },
            ]);
            const date = new Date("2021-03-05T07:59:59+01:00");
            clock = sinon.useFakeTimers(date);
            await chai.request(app).get("/cancelNewsletter");
            const newsletter = await knex("newsletters")
                .where({ id: mockNewsletter.id })
                .first();
            should.equal(newsletter.validator, null);
            await knex("newsletters").truncate();
            clock.restore();
        });
    });
});

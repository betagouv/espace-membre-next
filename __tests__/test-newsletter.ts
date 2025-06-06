import chai from "chai";
import chaiHttp from "chai-http";
import { add } from "date-fns/add";
import { format } from "date-fns/format";
import { fr } from "date-fns/locale/fr";
import { startOfWeek } from "date-fns/startOfWeek";
import HedgedocApi from "hedgedoc-api";
import nock from "nock";
import rewire from "rewire";
import sinon from "sinon";

import utils from "./utils";
import { db } from "@/lib/kysely";
import { renderHtmlFromMd } from "@/lib/mdtohtml";
import config from "@/server/config";
import * as Email from "@/server/config/email.config";
import * as session from "@/server/helpers/session";
import * as dateUtils from "@/utils/date";
import BetaGouv from "@betagouv";
import knex from "@db";
import * as chat from "@infra/chat";
import {
  createNewsletter,
  getJobOfferContent,
  newsletterReminder,
  sendNewsletterAndCreateNewOne,
} from "@schedulers/newsletterScheduler";

chai.use(chaiHttp);

const { NUMBER_OF_DAY_FROM_MONDAY } = dateUtils;

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

const newsletterScheduler = rewire(
  "../src/server/schedulers/newsletterScheduler",
);
const replaceMacroInContent = newsletterScheduler.__get__(
  "replaceMacroInContent",
);
const computeMessageReminder = newsletterScheduler.__get__(
  "computeMessageReminder",
);

const computeId = newsletterScheduler.__get__("computeId");

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
  publish_at: new Date("2021-04-04 10:30:00+00"),
  id: utils.randomUuid(),
};

describe("Newsletter", () => {
  let clock;

  describe("should get newsletter data for newsletter page", () => {
    let getToken;
    beforeEach(async () => {
      await db
        .insertInto("newsletters")
        .values([...mockNewsletters, mockNewsletter])
        .execute();
      getToken = sinon.stub(session, "getToken");
      getToken.returns(utils.getJWT("membre.actif"));
    });
    afterEach(async () => {
      await knex("newsletters").truncate();
      getToken.restore();
    });
  });

  describe("cronjob newsletter", () => {
    let slack;
    let jobsStub;
    let getToken;
    beforeEach((done) => {
      slack = sinon.spy(chat, "sendInfoToChat");
      jobsStub = sinon.stub(BetaGouv, "getJobsWTTJ").returns(
        Promise.resolve([
          {
            id: 807837,
            reference: "LCB_979pJ9D",
            name: "Dev Ruby on Rails expérimenté·e",
            slug: "dev-ruby-on-rails-experimente-e_cenac",
            description:
              '<p>L’équipe <a href="https://beta.gouv.fr/startups/lapins.html" target="_blank">RDV-Solidarités</a> recherche <strong>un·e dev Ruby on Rails expérimenté·e (3 ans d\'expérience)</strong> pour accélérer l’utilisation de la plateforme dans le cadre de la prise de RDV dans le champ de l’insertion et du RSA.</p>\n\n<p>Lancé en 2019 suite à une expérimentation dans le Pas-de-Calais, le service RDV-Solidarités s’est construit avec un consortium d’une dizaine de départements, principalement pour gérer les RDV du champ médico-social.</p>\n\n<p>Aujourd’hui, plus de 10 000 RDV sont pris hebdomadairement sur la plateforme, et le service s’ouvre à d’autres usages : conseillers numériques France Service, RSA et insertion, etc.</p>\n\n<p><strong>Responsabilités</strong></p>\n\n<p>Dans le cadre de ce recrutement, tu feras le lien avec l’équipe RDV-Insertion (<a href="http://www.rdv-insertion.fr" target="_blank">www.rdv-insertion.fr</a>), un service lié à RDV-Solidarités, en charge d’améliorer les parcours des bénéficiaires RSA. Tu auras donc en charge de comprendre et construire les features nécessaires aux usages spécifiques de l’insertion.</p>\n\n<p>Exemple de features déjà identifiées : </p>\n\n<ul>\n<li>développement des RDV collectifs dans le cadre des RDV du RSA</li>\n<li>développement d\'API pour appeler appeler RDV-Solidarités et RDV-Insertion depuis des sites externes</li>\n<li>amélioration de l\'interface utilisateur</li>\n<li>...</li>\n</ul>\n\n<p>Pour comprendre les roadmaps et comment les équipes de dev fonctionnent, n’hésite pas à parcourir les pages github de RDV-Solidarités (github.com/betagouv/rdv-solidarites.fret) et RDV-Insertion (github.com/betagouv/rdv-insertion) !</p>\n\n<p><strong>Stack</strong></p>\n\n<ul>\n<li>Technos : Ruby on Rails, bases de front-end (html / css / javascript)</li>\n<li>Code ouvert et libre</li>\n<li>Bonnes pratiques : le code est testé, revu, est déployé par petits lots </li>\n</ul>\n',
            published_at: "2022-07-05T12:23:43.029+02:00",
            profile:
              "<ul>\n<li>Tu as la volonté d'améliorer le service public</li>\n<li>Tu es autonome dans la conception, l'écriture et le déploiement de ton code, et en maîtrises les bonnes pratiques </li>\n<li>Tu sais faire preuve d'initiative et tenir tes engagement</li>\n<li>Tu es curieuse ou curieux, et capable d'interagir avec des équipes variées (incubateur des territoires, conseils départementaux, conseillers numériques)</li>\n<li>Tu aimes travailler dans une petite équipe et de manière agile</li>\n<li>Tu es à l'écoute et à l'aise dans la communication orale et écrite, avec tes collègues et en public</li>\n</ul>\n",
            recruitment_process:
              "<p>Le process de recrutement est de deux entretiens (techniques et produit), avant un <strong>démarrage souhaité dès que possible</strong>. </p>\n\n<p>Le poste ouvert pour une indépendante ou un indépendant pour un <strong>premier contrat de 3 mois renouvelable</strong>, à temps plein (3/5 ou 4/5 par semaine négociable selon le profil).</p>\n\n<p>Le télétravail est possible, et une présence ponctuelle à Paris est demandée pour participer aux sessions stratégiques et collaboratives.</p>\n\n<p>Enfin, le TJM est à définir et selon expérience, dans une fourchette entre 500 et 600 euros / jours.</p>\n",
          },
        ]),
      );
      getToken = sinon.stub(session, "getToken");
      getToken.returns(utils.getJWT("membre.actif"));
      done();
    });

    afterEach((done) => {
      jobsStub.restore();
      slack.restore();
      getToken.restore();
      done();
    });

    it("should create new note", async () => {
      const createNewNoteWithContentAndAliasSpy = sinon.spy(
        HedgedocApi.prototype,
        "createNewNoteWithContentAndAlias",
      );
      const date = new Date("2021-03-04T07:59:59+01:00");
      const newsletterDate = add(startOfWeek(date, { weekStartsOn: 1 }), {
        weeks: 2,
      });
      clock = sinon.useFakeTimers(date);
      const newsletterName = `infolettre-${computeId(
        newsletterDate.toISOString().split("T")[0],
      )}`;
      const padHeadCall = nock(`${config.padURL}`).persist().head(/.*/).reply(
        200,
        {
          status: "OK",
        },
        {
          "set-cookie": "73dajkhs8934892jdshakldsja",
        },
      );

      const padPostLoginCall = nock(`${config.padURL}`)
        .persist()
        .post(/^.*login.*/)
        .reply(
          200,
          {},
          {
            "set-cookie": "73dajkhs8934892jdshakldsja",
          },
        );

      const padGetDownloadCall = nock(`${config.padURL}`)
        .get(/^.*\/download/)
        .reply(200, NEWSLETTER_TEMPLATE_CONTENT);

      const padPostNewCall = nock(`${config.padURL}`)
        .post(/^.*new/)
        .reply(301, undefined, {
          Location: `${config.padURL}/${newsletterName}`,
        })
        .get(`/${newsletterName}`)
        .reply(200, "");

      await createNewsletter();
      padHeadCall.isDone().should.be.true;
      padGetDownloadCall.isDone().should.be.true;
      padPostLoginCall.isDone().should.be.true;
      padPostNewCall.isDone().should.be.true;
      createNewNoteWithContentAndAliasSpy.firstCall.args[0].should.equal(
        replaceMacroInContent(NEWSLETTER_TEMPLATE_CONTENT, {
          __REMPLACER_PAR_LIEN_DU_PAD__: `${config.padURL}/${newsletterName}`,
          __REMPLACER_PAR_DATE_STAND_UP__: format(
            add(startOfWeek(newsletterDate, { weekStartsOn: 1 }), {
              days: 7 + NUMBER_OF_DAY_FROM_MONDAY.THURSDAY,
            }),
            "d MMMM yyyy",
            { locale: fr },
          ),
          __REMPLACER_PAR_OFFRES__: await getJobOfferContent(),
          __REMPLACER_PAR_DATE__: format(
            add(date, { weeks: 2 }),
            "d MMMM yyyy",
            { locale: fr },
          ),
        }),
      );
      const newsletter = await db
        .selectFrom("newsletters")
        .selectAll()
        .orderBy("created_at")
        .executeTakeFirstOrThrow();
      newsletter.url.should.equal(`${config.padURL}/${newsletterName}`);
      clock.restore();
      await knex("newsletters").truncate();
    });

    it("should send remind on monday at 8am", async () => {
      await db
        .insertInto("newsletters")
        .values({ ...mockNewsletter })
        .execute();
      clock = sinon.useFakeTimers(add(mockNewsletter.publish_at, { days: -5 }));
      await newsletterReminder("FIRST_REMINDER");
      slack.firstCall.args[0].text.should.equal(
        computeMessageReminder("FIRST_REMINDER", mockNewsletter),
      );
      slack.calledTwice.should.be.true;
      clock.restore();
      slack.restore();
      await knex("newsletters").truncate();
    });

    it("should send remind on thursday at 8am", async () => {
      await db
        .insertInto("newsletters")
        .values({ ...mockNewsletter })
        .execute();
      clock = sinon.useFakeTimers(add(mockNewsletter.publish_at, { days: 0 }));
      await newsletterReminder("SECOND_REMINDER");
      slack.firstCall.args[0].text.should.equal(
        computeMessageReminder("SECOND_REMINDER", mockNewsletter),
      );
      slack.calledTwice.should.be.true;
      clock.restore();
      slack.restore();
      await knex("newsletters").truncate();
    });

    it("should send remind on thursday at 6pm", async () => {
      await db
        .insertInto("newsletters")
        .values({ ...mockNewsletter })
        .execute();
      clock = sinon.useFakeTimers(add(mockNewsletter.publish_at, { days: 0 }));
      await newsletterReminder("THIRD_REMINDER");
      slack.firstCall.args[0].text.should.equal(
        computeMessageReminder("THIRD_REMINDER", mockNewsletter),
      );
      slack.calledTwice.should.be.true;
      clock.restore();
      slack.restore();
      await knex("newsletters").truncate();
    });

    it("should not send remind if no newsletter", async () => {
      clock = sinon.useFakeTimers(new Date("2021-03-05T07:59:59+01:00"));
      await newsletterReminder("THIRD_REMINDER");
      slack.notCalled.should.be.true;
      clock.restore();
      slack.restore();
    });

    it("should send newsletter if publish_at is today and time", async () => {
      const date = new Date(mockNewsletter.publish_at);
      const dateAsString = format(add(date, { weeks: 2 }), "d MMMM yyyy", {
        locale: fr,
      });
      const contentWithMacro = replaceMacroInContent(
        NEWSLETTER_TEMPLATE_CONTENT,
        {
          __REMPLACER_PAR_LIEN_DU_PAD__: `${config.padURL}/jfkdsfljkslfsfs`,
          __REMPLACER_PAR_DATE_STAND_UP__: format(
            add(startOfWeek(date, { weekStartsOn: 1 }), {
              weeks: 1,
              days: NUMBER_OF_DAY_FROM_MONDAY.THURSDAY,
            }),
            "d MMMM yyyy",
            {
              locale: fr,
            },
          ),
          __REMPLACER_PAR_DATE__: dateAsString,
        },
      );
      utils.cleanMocks();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();
      utils.mockOvhTime();
      utils.mockOvhRedirections();
      utils.mockOvhUserResponder();
      utils.mockOvhUserEmailInfos();
      const padHeadCall = nock(`${config.padURL}`).persist().head(/.*/).reply(
        200,
        {
          status: "OK",
        },
        {
          "set-cookie": "73dajkhs8934892jdshakldsja",
        },
      );

      const padPostLoginCall = nock(`${config.padURL}`)
        .persist()
        .post(/^.*login.*/)
        .reply(
          200,
          {},
          {
            "set-cookie": "73dajkhs8934892jdshakldsja",
          },
        );

      const padGetDownloadCall = nock(`${config.padURL}`)
        .get(/^.*\/download/)
        .reply(200, contentWithMacro)
        .persist();

      const padPostNewCall = nock(`${config.padURL}`)
        .post(/^.*new/)
        .reply(200, "");

      await db
        .insertInto("newsletters")
        .values({
          ...mockNewsletter,
          validator: "julien.dauphant",
          sent_at: null,
        })
        .execute();
      const sendEmailStub = sinon
        .stub(Email, "sendEmail")
        .returns(Promise.resolve(null));
      clock = sinon.useFakeTimers(date);
      await sendNewsletterAndCreateNewOne();
      padHeadCall.isDone().should.be.true;
      padGetDownloadCall.isDone().should.be.true;
      padPostLoginCall.isDone().should.be.true;
      padPostNewCall.isDone().should.be.true;
      sendEmailStub.calledOnce.should.be.true;
      sendEmailStub.firstCall.args[0].variables.subject.should.equal(
        replaceMacroInContent(NEWSLETTER_TITLE, {
          __REMPLACER_PAR_DATE__: dateAsString,
        }),
      );
      sendEmailStub.firstCall.args[0].toEmail
        .join(",")
        .should.equal(`secretariat@beta.gouv.fr`);
      sendEmailStub.firstCall.args[0].variables.body.should.equal(
        renderHtmlFromMd(contentWithMacro),
      );
      slack.called.should.be.true;
      const newsletter = await db
        .selectFrom("newsletters")
        .selectAll()
        .orderBy("created_at")
        .where("sent_at", "is not", null)
        .executeTakeFirstOrThrow();
      newsletter.sent_at.should.not.be.null;
      clock.restore();
      sendEmailStub.restore();
      slack.restore();
      await knex("newsletters").truncate();
    });

    it("should not send newsletter if publish_at is not a the right time", async () => {
      const date = add(new Date(mockNewsletter.publish_at), { hours: 2 });
      await db
        .insertInto("newsletters")
        .values({
          ...mockNewsletter,
          validator: "julien.dauphant",
          sent_at: null,
        })
        .execute();
      const sendEmailStub = sinon
        .stub(Email, "sendEmail")
        .returns(Promise.resolve(null));
      clock = sinon.useFakeTimers(date);
      await sendNewsletterAndCreateNewOne();
      sendEmailStub.calledOnce.should.be.false;
      clock.restore();
      sendEmailStub.restore();
      slack.restore();
      await knex("newsletters").truncate();
    });
  });
});

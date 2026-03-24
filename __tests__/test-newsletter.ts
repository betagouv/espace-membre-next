import chai from "chai";
import chaiHttp from "chai-http";
import { add } from "date-fns/add";
import sinon from "sinon";
import rewire from "rewire";

import utils from "./utils";
import { db } from "@/lib/kysely";
import { newsletterReminder } from "@schedulers/newsletterScheduler";
import * as chat from "@infra/chat";
import knex from "@db";

chai.use(chaiHttp);

const newsletterScheduler = rewire(
  "../src/server/schedulers/newsletterScheduler",
);
const computeMessageReminder = newsletterScheduler.__get__(
  "computeMessageReminder",
);

const mockNewsletter = {
  url: `https://docs.numerique.gouv.fr/some-fixed-doc`,
  created_at: new Date("2021-04-04 00:00:00+00"),
  publish_at: new Date("2021-04-04 10:30:00+00"),
  id: utils.randomUuid(),
};

describe("Newsletter", () => {
  let clock;

  describe("cronjob newsletter reminders", () => {
    let slack;

    beforeEach((done) => {
      slack = sinon.spy(chat, "sendInfoToChat");
      done();
    });

    afterEach((done) => {
      slack.restore();
      done();
    });

    it("should send first reminder 5 days before publish_at", async () => {
      await db.insertInto("newsletters").values({ ...mockNewsletter }).execute();
      clock = sinon.useFakeTimers(add(mockNewsletter.publish_at, { days: -5 }));
      await newsletterReminder("FIRST_REMINDER");
      slack.firstCall.args[0].text.should.equal(
        computeMessageReminder("FIRST_REMINDER"),
      );
      slack.calledTwice.should.be.true;
      clock.restore();
      await knex("newsletters").truncate();
    });

    it("should send second reminder on publish day", async () => {
      await db.insertInto("newsletters").values({ ...mockNewsletter }).execute();
      clock = sinon.useFakeTimers(add(mockNewsletter.publish_at, { days: 0 }));
      await newsletterReminder("SECOND_REMINDER");
      slack.firstCall.args[0].text.should.equal(
        computeMessageReminder("SECOND_REMINDER"),
      );
      slack.calledTwice.should.be.true;
      clock.restore();
      await knex("newsletters").truncate();
    });

    it("should send third reminder on publish day", async () => {
      await db.insertInto("newsletters").values({ ...mockNewsletter }).execute();
      clock = sinon.useFakeTimers(add(mockNewsletter.publish_at, { days: 0 }));
      await newsletterReminder("THIRD_REMINDER");
      slack.firstCall.args[0].text.should.equal(
        computeMessageReminder("THIRD_REMINDER"),
      );
      slack.calledTwice.should.be.true;
      clock.restore();
      await knex("newsletters").truncate();
    });

    it("should not send reminder if no newsletter", async () => {
      clock = sinon.useFakeTimers(new Date("2021-03-05T07:59:59+01:00"));
      await newsletterReminder("THIRD_REMINDER");
      slack.notCalled.should.be.true;
      clock.restore();
    });

    it("should not send reminder if publish_at is not defined", async () => {
      await db
        .insertInto("newsletters")
        .values({ ...mockNewsletter, publish_at: null })
        .execute();
      clock = sinon.useFakeTimers(new Date("2021-03-05T07:59:59+01:00"));
      await newsletterReminder("FIRST_REMINDER");
      slack.notCalled.should.be.true;
      clock.restore();
      await knex("newsletters").truncate();
    });
  });
});

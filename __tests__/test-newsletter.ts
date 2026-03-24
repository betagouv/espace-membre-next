import chai from "chai";
import { parseExpression } from "cron-parser";
import sinon from "sinon";

import config from "@/server/config";
import {
  computeMessageReminder,
  newsletterReminder,
} from "@schedulers/newsletterScheduler";
import * as chat from "@infra/chat";

chai.should();

// Default cron expressions from cron.ts
const FIRST_REMINDER_CRON =
  process.env.NEWSLETTER_FIRST_REMINDER_TIME || "0 10 * * 3"; // Wednesday 10:00
const SECOND_REMINDER_CRON =
  process.env.NEWSLETTER_SECOND_REMINDER_TIME || "0 8 * * 2"; // Tuesday 08:00

describe("Newsletter reminder scheduler", () => {
  describe("cron periodicity", () => {
    it("first reminder fires on Wednesday at 10:00", () => {
      const interval = parseExpression(FIRST_REMINDER_CRON, {
        currentDate: new Date("2025-01-06T09:59:00Z"), // Monday
        utc: true,
      });
      const next = interval.next().toDate();
      next.getUTCDay().should.equal(3); // Wednesday
      next.getUTCHours().should.equal(10);
      next.getUTCMinutes().should.equal(0);
    });

    it("first reminder fires weekly", () => {
      const interval = parseExpression(FIRST_REMINDER_CRON, {
        currentDate: new Date("2025-01-08T10:01:00Z"), // Wednesday just after 10:00
        utc: true,
      });
      const next1 = interval.next().toDate();
      const next2 = interval.next().toDate();
      const diff = next2.getTime() - next1.getTime();
      diff.should.equal(7 * 24 * 60 * 60 * 1000); // exactly one week apart
    });

    it("second reminder fires on Tuesday at 08:00", () => {
      const interval = parseExpression(SECOND_REMINDER_CRON, {
        currentDate: new Date("2025-01-06T07:59:00Z"), // Monday
        utc: true,
      });
      const next = interval.next().toDate();
      next.getUTCDay().should.equal(2); // Tuesday
      next.getUTCHours().should.equal(8);
      next.getUTCMinutes().should.equal(0);
    });

    it("second reminder fires weekly", () => {
      const interval = parseExpression(SECOND_REMINDER_CRON, {
        currentDate: new Date("2025-01-07T08:01:00Z"), // Tuesday just after 08:00
        utc: true,
      });
      const next1 = interval.next().toDate();
      const next2 = interval.next().toDate();
      const diff = next2.getTime() - next1.getTime();
      diff.should.equal(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe("reminder message content", () => {
    it("FIRST_REMINDER message contains the content URL", () => {
      const message = computeMessageReminder("FIRST_REMINDER");
      message.should.include(config.newsletterContentUrl);
    });

    it("SECOND_REMINDER message contains the content URL", () => {
      const message = computeMessageReminder("SECOND_REMINDER");
      message.should.include(config.newsletterContentUrl);
    });

    it("THIRD_REMINDER message contains the content URL", () => {
      const message = computeMessageReminder("THIRD_REMINDER");
      message.should.include(config.newsletterContentUrl);
    });

    it("FIRST_REMINDER message mentions mardi", () => {
      const message = computeMessageReminder("FIRST_REMINDER");
      message.should.include("mardi");
    });

    it("SECOND_REMINDER message mentions 16h", () => {
      const message = computeMessageReminder("SECOND_REMINDER");
      message.should.include("16h");
    });
  });

  describe("newsletterReminder sends to correct channels", () => {
    let sendInfoToChatSpy: sinon.SinonSpy;

    beforeEach(() => {
      sendInfoToChatSpy = sinon.stub(chat, "sendInfoToChat").resolves();
    });

    afterEach(() => {
      sendInfoToChatSpy.restore();
    });

    it("sends to general and town-square", async () => {
      await newsletterReminder("FIRST_REMINDER");
      sendInfoToChatSpy.calledTwice.should.be.true;
      const channels = sendInfoToChatSpy.args.map((args) => args[0].channel);
      channels.should.include("general");
      channels.should.include("town-square");
    });

    it("sends correct message for FIRST_REMINDER", async () => {
      await newsletterReminder("FIRST_REMINDER");
      sendInfoToChatSpy.firstCall.args[0].text.should.equal(
        computeMessageReminder("FIRST_REMINDER"),
      );
    });

    it("sends correct message for SECOND_REMINDER", async () => {
      await newsletterReminder("SECOND_REMINDER");
      sendInfoToChatSpy.firstCall.args[0].text.should.equal(
        computeMessageReminder("SECOND_REMINDER"),
      );
    });
  });
});

import { format } from "date-fns/format";
import { fr } from "date-fns/locale/fr";
import ejs from "ejs";

import betagouv from "../betagouv";
import { sendCampaignEmail } from "@/server/config/email.config";
import { sendInfoToChat } from "@infra/chat";
import { getEventsForCalendarFromDateToDate } from "@lib/icalhelper";
import { EMAIL_TYPES, MAILING_LIST_TYPE } from "@modules/email";

interface ReadableEvents {
  startDate: string;
  endDate: string;
  startDateAsDate: Date;
  location: string;
  title: string;
}

const makeReadableEvent = (events) => {
  const titles: string[] = [];
  return events
    .sort((event) => event.startDate)
    .map((event) => ({
      startDate: format(event.startDate, "dd/MM/yyyy à HH:mm"),
      startDateAsDate: event.startDate,
      endDate: format(event.endDate, "dd/MM/yyyy à HH:mm"),
      location: event.location,
      title: event.title,
    }))
    .filter((event) => {
      // hack to prevent duplicate
      if (!titles.includes(event.title)) {
        titles.push(event.title);
        return true;
      } else {
        return false;
      }
    });
};

export const sendForumBetaReminder = async (
  numberOfDays: number = 12,
  canal: string = "general",
) => {
  const today = new Date();
  const dayInXDays = new Date();
  dayInXDays.setDate(today.getDate() + numberOfDays);
  const dayInXDaysMoreOnWeek = new Date();
  dayInXDaysMoreOnWeek.setDate(dayInXDays.getDate() + 6);
  const calendarURL = process.env.CALENDAR_URL;
  const events: {} = await getEventsForCalendarFromDateToDate(
    calendarURL,
    dayInXDays,
    dayInXDaysMoreOnWeek,
  );
  let readableEvents: ReadableEvents[] = makeReadableEvent(events);
  const forumBetaEvent = readableEvents.find((event) =>
    event.title.toLowerCase().includes("forum beta.gouv"),
  );
  if (forumBetaEvent) {
    const messageContent = await ejs.renderFile(
      "./src/server/views/templates/emails/forumBetaMessage.ejs",
      {
        event: forumBetaEvent,
        date: format(forumBetaEvent.startDateAsDate, "d MMMM", {
          locale: fr,
        }),
        location: forumBetaEvent.location,
        CALENDAR_PUBLIC_URL: process.env.CALENDAR_PUBLIC_URL,
      },
    );
    await betagouv.sendInfoToChat(messageContent, canal);
    await sendCampaignEmail({
      subject: "Ne manquez pas le forum beta.gouv.fr du <%= date %> !",
      mailingListType: MAILING_LIST_TYPE.FORUM_REMINDER,
      type: EMAIL_TYPES.EMAIL_FORUM_REMINDER,
      variables: {
        date: format(forumBetaEvent.startDateAsDate, "d MMMM", {
          locale: fr,
        }),
        calendar_public_url: process.env.CALENDAR_PUBLIC_URL,
        location: forumBetaEvent.location,
      },
      forceTemplate: true,
      campaignName: `Forum beta reminder du ${forumBetaEvent.startDate}`,
    });
  }
  return forumBetaEvent;
};

export const postEventsOnMattermost = async ({
  numberOfDays = 6,
  canal,
  calendarURL,
  calendarPublicUrl,
  chatWebhook,
}: {
  numberOfDays: number;
  canal?: string;
  calendarURL: string;
  chatWebhook?: string;
  calendarPublicUrl: string;
}) => {
  const today = new Date();
  const dayInSixDays = new Date();
  dayInSixDays.setDate(today.getDate() + numberOfDays);
  const events = await getEventsForCalendarFromDateToDate(
    calendarURL,
    today,
    dayInSixDays,
  );

  const readableEvents: ReadableEvents[] = makeReadableEvent(events);
  const messageContent = await ejs.renderFile(
    "./src/server/views/templates/emails/eventMessage.ejs",
    {
      events: readableEvents,
      CALENDAR_PUBLIC_URL: calendarPublicUrl,
    },
  );
  sendInfoToChat({
    text: messageContent,
    channel: canal,
    hookURL: chatWebhook,
  });
};

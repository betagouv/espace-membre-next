import crypto from "crypto";
import { isSameDay, startOfDay } from "date-fns";
import { add } from "date-fns/add";
import { differenceInDays } from "date-fns/differenceInDays";
import { format } from "date-fns/format";
import { fr } from "date-fns/locale/fr";
import { startOfWeek } from "date-fns/startOfWeek";
import HedgedocApi from "hedgedoc-api";

import BetaGouv from "../betagouv";
import { db } from "@/lib/kysely";
import { getTitle, renderHtmlFromMd } from "@/lib/mdtohtml";
import { JobWTTJ } from "@/models/job";
import config from "@/server/config";
import { sendEmail, sendCampaignEmail } from "@/server/config/email.config";
import * as dateUtils from "@/utils/date";
import { sendInfoToChat } from "@infra/chat";
import { EMAIL_TYPES, MAILING_LIST_TYPE } from "@modules/email";

const { NUMBER_OF_DAY_FROM_MONDAY } = dateUtils;

const replaceMacroInContent = (newsletterTemplateContent, replaceConfig) => {
  const contentWithReplacement = Object.keys(replaceConfig).reduce(
    (previousValue, key) => previousValue.replace(key, replaceConfig[key]),
    newsletterTemplateContent,
  );
  return contentWithReplacement;
};

const computeId = (dateAsString) => {
  const id = crypto
    .createHmac("sha256", config.newsletterHashSecret!)
    .update(dateAsString)
    .digest("hex")
    .slice(0, 8);
  return id;
};

const createNewsletter = async () => {
  let date = startOfWeek(new Date(), { weekStartsOn: 1 }); // get first day of the current week
  date = add(date, { weeks: 2 }); // get next monday (date + 14 days)
  const pad = new HedgedocApi(
    config.padEmail,
    config.padPassword,
    config.padURL,
  );
  const newsletterName = `infolettre-${computeId(
    date.toISOString().split("T")[0],
  )}`;
  const replaceConfig = {
    __REMPLACER_PAR_LIEN_DU_PAD__: `${config.padURL}/${newsletterName}`,
    // next stand up is a week after the newsletter date on thursday
    __REMPLACER_PAR_DATE_STAND_UP__: format(
      add(date, { weeks: 1, days: NUMBER_OF_DAY_FROM_MONDAY.THURSDAY }),
      "d MMMM yyyy",
      { locale: fr },
    ),
    __REMPLACER_PAR_OFFRES__: await getJobOfferContent(),
    __REMPLACER_PAR_DATE__: format(
      add(date, {
        days: NUMBER_OF_DAY_FROM_MONDAY[config.newsletterSentDay],
      }),
      "d MMMM yyyy",
      { locale: fr },
    ),
  };

  // change content in template
  let newsletterTemplateContent = await pad.getNoteWithId(
    config.newsletterTemplateId,
  );
  newsletterTemplateContent = replaceMacroInContent(
    newsletterTemplateContent,
    replaceConfig,
  );

  const result = await pad.createNewNoteWithContentAndAlias(
    newsletterTemplateContent,
    newsletterName,
  );
  const padUrl = result.request.res.responseUrl;
  const message = `Nouveau pad pour l'infolettre : ${padUrl}`;

  const today = new Date();
  const dateIn14Days = add(today, { days: 14 });
  await db
    .insertInto("newsletters")
    .values({
      url: padUrl,
      publish_at: dateIn14Days,
    })
    .execute();
  await sendInfoToChat({
    text: message,
  });
  return padUrl;
};

const computeMessageReminder = (reminder, newsletter) => {
  let message;
  if (reminder === "FIRST_REMINDER") {
    message = `### Participez à la newsletter interne beta.gouv.fr ! :loudspeaker: :
:wave:  Bonjour, tout le monde ! 

La newsletter de la communauté sera désormais envoyée le mardi.

Voici le pad à remplir pour contribuer à la prochaine newsletter ${newsletter.url} !

Ce que tu peux partager :
- des nouveautés sur ton produit
- des demandes d'aide ou de contribution
- des événements
- des formations
- des nouveautés transverses

Le pad sera envoyé mardi prochain, sous forme d'infolettre à la communauté !`;
  } else if (reminder === "SECOND_REMINDER") {
    message = `### Dernière chance pour contribuer à la newsletter interne beta.gouv.fr ! :loudspeaker: 

:wave:  Bonjour, tout le monde ! 

Voici le pad à remplir pour contribuer à la prochaine newsletter ${newsletter.url} !

Ce que tu peux partager : 
- des nouveautés sur ton produit
- des demandes d'aide ou de contribution
- des événements
- des formations
- des nouveautés transverses

Ajoute les au pad de cette semaine !

**La newsletter sera envoyée à partir de 16h !**`;
  } else {
    message = `*:rolled_up_newspaper: La newsletter va bientôt partir !*
Vérifie une dernière fois le contenu du pad ${newsletter.url}. À 16 h, il sera envoyé à la communauté.`;
  }
  return message;
};

const REMINDER_NB_DAYS = {
  FIRST_REMINDER: -5,
  SECOND_REMINDER: 0,
  THIRD_REMINDER: 0,
};

export async function newsletterReminder(reminder) {
  const currentNewsletter = await db
    .selectFrom("newsletters")
    .selectAll()
    .where("sent_at", "is", null)
    .executeTakeFirst();

  if (!currentNewsletter?.publish_at) {
    // if publish_at is not defined, we do not send reminder
    return;
  }

  const today = new Date();
  const days = differenceInDays(
    startOfDay(today),
    startOfDay(currentNewsletter.publish_at),
  );
  if (REMINDER_NB_DAYS[reminder] !== days) {
    return;
  }

  if (currentNewsletter) {
    await sendInfoToChat({
      text: computeMessageReminder(reminder, currentNewsletter),
      channel: "general",
      extra: {
        username: "Pikachu (équipe Communauté beta.gouv.fr)",
        icon_url: config.NEWSLETTER_BOT_ICON_URL,
      },
    });
    await sendInfoToChat({
      text: computeMessageReminder(reminder, currentNewsletter),
      channel: "town-square",
      space: "dinum",
      extra: {
        username: "Pikachu (équipe Communauté beta.gouv.fr)",
        icon_url: config.NEWSLETTER_BOT_ICON_URL,
      },
    });
  }
}

export async function getJobOfferContent() {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 }); // get first day of the current week
  const jobs: JobWTTJ[] = await BetaGouv.getJobsWTTJ();
  const filteredJobs = jobs.filter(
    (job) => new Date(job.published_at) > monday,
  );
  const content = filteredJobs
    .map((job) => {
      return `[${job.name.trim()}](https://www.welcometothejungle.com/companies/communaute-beta-gouv/jobs/${
        job.slug
      })`;
    })
    .join("\n");
  return content;
}

export { createNewsletter };

export async function sendNewsletterAndCreateNewOne(
  shouldCreatedNewone = true,
) {
  const currentNewsletter = await db
    .selectFrom("newsletters")
    .selectAll()
    .where("sent_at", "is", null)
    .executeTakeFirstOrThrow();

  if (!currentNewsletter?.publish_at) {
    // if publish_at is not defined, we do not send newsletter
    return;
  }

  const today = new Date();
  if (
    isSameDay(today, currentNewsletter.publish_at) &&
    today.getHours() === currentNewsletter.publish_at.getHours()
  ) {
    if (config.FEATURE_SEND_NEWSLETTER || process.env.NODE_ENV === "test") {
      const pad = new HedgedocApi(
        config.padEmail,
        config.padPassword,
        config.padURL,
      );
      const newsletterCurrentId = currentNewsletter.url.replace(
        `${config.padURL}/`,
        "",
      );
      const newsletterContent = await pad.getNoteWithId(newsletterCurrentId);
      const html = renderHtmlFromMd(newsletterContent);

      await sendCampaignEmail({
        mailingListType: MAILING_LIST_TYPE.NEWSLETTER,
        type: EMAIL_TYPES.EMAIL_NEWSLETTER,
        variables: {},
        campaignName: `${getTitle(newsletterContent)}`,
        subject: `${getTitle(newsletterContent)}`,
        htmlContent: html,
      });

      await sendEmail({
        toEmail: [...config.newsletterBroadcastList.split(",")],
        type: EMAIL_TYPES.EMAIL_NEWSLETTER,
        variables: {
          body: html,
          subject: `${getTitle(newsletterContent)}`,
        },
      });
    }

    await db
      .updateTable("newsletters")
      .where("id", "=", currentNewsletter.id)
      .set({
        sent_at: new Date(),
      })
      .execute();
    if (shouldCreatedNewone) {
      await createNewsletter();
    }
  }
}

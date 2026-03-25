import { differenceInDays } from "date-fns/differenceInDays";
import { startOfWeek } from "date-fns/startOfWeek";

import BetaGouv from "../betagouv";
import { db } from "@/lib/kysely";
import { JobWTTJ } from "@/models/job";
import config from "@/server/config";
import { sendInfoToChat } from "@infra/chat";
import { startOfDay } from "date-fns/startOfDay";

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
    console.log(`Send newsletterReminder ${reminder}`);
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

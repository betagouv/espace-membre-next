import { differenceInDays } from "date-fns/differenceInDays";
import { startOfWeek } from "date-fns/startOfWeek";

import { db } from "@/lib/kysely";
import config from "@/server/config";
import { sendInfoToChat } from "@infra/chat";

const url = config.newsletterContentUrl;

// Every Wednesday at 10:00
const firstReminders = [
  `### :loudspeaker: La newsletter beta.gouv.fr arrive bientôt — et elle a besoin de toi !

:wave: Salut la communauté !

La newsletter part **mardi prochain** et le document est ouvert à toutes les contributions : ${url}

Tu peux y partager :
- les dernières actus de ton produit
- des appels à l'aide ou à la contribution
- des événements à venir
- des formations ou ressources utiles
- des initiatives transverses

**Chaque contribution compte** — même une ligne, même un lien. À toi de jouer ! :pencil:`,

  `### :newspaper: C'est l'heure de la newsletter ! Tu contribues ?

:wave: Bonjour tout le monde !

La newsletter de la communauté beta.gouv.fr sera envoyée **mardi prochain**. Le document collaboratif est ouvert : ${url}

Quelques idées de ce que tu peux partager :
- une nouveauté sur ton produit ou service
- une demande d'aide ou de bras en renfort :raised_hands:
- un événement ou une formation à ne pas manquer
- une info transverse utile à toute la communauté

:bulb: Pas besoin d'être expert en rédaction — l'équipe s'occupe de la mise en forme. Il suffit d'ajouter tes idées !`,

  `### :mega: La newsletter beta.gouv.fr se prépare — à vos claviers !

:wave: Hello la communauté !

Chaque semaine, la newsletter rassemble les actus de nos 200+ équipes. **C'est aussi la tienne.** Le document de cette semaine : ${url}

Ce que les équipes partagent en général :
- :rocket: Lancements, mises à jour, victoires
- :sos: Besoins d'aide ou de compétences
- :calendar: Événements et formations à venir
- :bulb: Idées et initiatives transverses

La newsletter part **mardi** — plus tu contribues tôt, mieux c'est !`,
];

// Every Tuesday at 08:00
const secondReminders = [
  `### :hourglass_flowing_sand: Dernière chance — la newsletter part aujourd'hui !

:wave: Bonjour !

Il reste encore un peu de temps pour contribuer à la newsletter beta.gouv.fr : ${url}

Tu peux encore ajouter :
- des nouveautés sur ton produit
- des appels à contribution ou à l'aide
- des événements ou formations
- des infos transverses

**:alarm_clock: Envoi à partir de 16h — dépêche-toi !**`,

  `### :rotating_light: La newsletter ferme ses portes à 16h !

:wave: Hello !

La newsletter de cette semaine est encore ouvert pour quelques heures : ${url}

Une actu à partager ? Une demande d'aide ? Un événement à signaler ? **Ajoute-le maintenant**, avant l'envoi à toute la communauté.

:clock4: **Deadline : 16h aujourd'hui.**`,

  `### :rocket: Dernière ligne droite pour la newsletter !

:wave: Coucou la communauté !

La newsletter beta.gouv.fr part **aujourd'hui à 16h**. Le document est encore modifiable : ${url}

Même une toute petite contribution — une ligne, un lien, une annonce — enrichit l'infolettre pour tout le monde. :sparkles:

**Plus que quelques heures !**`,
];

const defaultReminders = [
  `*:rolled_up_newspaper: La newsletter va bientôt partir !*
Vérifie une dernière fois le contenu du document ${url}. À 16 h, il sera envoyé à la communauté.`,

  `*:mailbox_with_mail: Dernier appel avant envoi !*
Le document part dans quelques instants. Un dernier coup d'œil ? ${url} — à 16h, c'est parti pour toute la communauté !`,

  `*:checkered_flag: La newsletter est sur le départ !*
Plus que quelques minutes pour vérifier le contenu : ${url}. À 16h, l'infolettre est envoyée à la communauté. :wave:`,
];

export const computeMessageReminder = (reminder) => {
  let message;
  if (reminder === "FIRST_REMINDER") {
    message = firstReminders[Math.floor(Math.random() * firstReminders.length)];
  } else if (reminder === "SECOND_REMINDER") {
    message =
      secondReminders[Math.floor(Math.random() * secondReminders.length)];
  } else {
    message =
      defaultReminders[Math.floor(Math.random() * defaultReminders.length)];
  }
  return message;
};

export async function newsletterReminder(reminder) {
  const message = computeMessageReminder(reminder);
  await sendInfoToChat({
    text: message,
    channel: "general",
    extra: {
      username: "Pikachu (équipe Communauté beta.gouv.fr)",
      icon_url: config.NEWSLETTER_BOT_ICON_URL,
    },
  });
  await sendInfoToChat({
    text: message,
    channel: "town-square",
    space: "dinum",
    extra: {
      username: "Pikachu (équipe Communauté beta.gouv.fr)",
      icon_url: config.NEWSLETTER_BOT_ICON_URL,
    },
  });
}

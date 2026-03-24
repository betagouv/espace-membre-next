<<<<<<< HEAD
import { differenceInDays } from "date-fns/differenceInDays";
import { startOfWeek } from "date-fns/startOfWeek";
=======
import { startOfDay } from "date-fns";
import { differenceInDays } from "date-fns/differenceInDays";
>>>>>>> 272daaae (chore: remove newsletter+pad stuff)

import { db } from "@/lib/kysely";
import config from "@/server/config";
import { sendInfoToChat } from "@infra/chat";

const computeMessageReminder = (reminder) => {
  const url = config.newsletterContentUrl;
  let message;
  if (reminder === "FIRST_REMINDER") {
    message = `### Participez à la newsletter interne beta.gouv.fr ! :loudspeaker: :
:wave:  Bonjour, tout le monde !

La newsletter de la communauté sera désormais envoyée le mardi.

Voici le document à remplir pour contribuer à la prochaine newsletter ${url} !

Ce que tu peux partager :
- des nouveautés sur ton produit
- des demandes d'aide ou de contribution
- des événements
- des formations
- des nouveautés transverses

Le document sera envoyé mardi prochain, sous forme d'infolettre à la communauté !`;
  } else if (reminder === "SECOND_REMINDER") {
    message = `### Dernière chance pour contribuer à la newsletter interne beta.gouv.fr ! :loudspeaker:

:wave:  Bonjour, tout le monde !

Voici le document à remplir pour contribuer à la prochaine newsletter ${url} !

Ce que tu peux partager :
- des nouveautés sur ton produit
- des demandes d'aide ou de contribution
- des événements
- des formations
- des nouveautés transverses

Ajoute les au document de cette semaine !

**La newsletter sera envoyée à partir de 16h !**`;
  } else {
    message = `*:rolled_up_newspaper: La newsletter va bientôt partir !*
Vérifie une dernière fois le contenu du document ${url}. À 16 h, il sera envoyé à la communauté.`;
  }
  return message;
};

const REMINDER_NB_DAYS = {
  FIRST_REMINDER: -5,
  SECOND_REMINDER: 0,
  THIRD_REMINDER: 0,
};


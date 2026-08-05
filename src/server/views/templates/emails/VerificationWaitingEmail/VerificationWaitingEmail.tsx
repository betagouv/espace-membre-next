import { MjmlText, MjmlButton } from "@/server/modules/mjml/mjml";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import { EmailVerificationWaiting } from "@/server/modules/email";

export function VerificationWaitingEmailTitle() {
  return `Ta fiche a été validée.`;
}

export function VerificationWaitingEmail({
  secretariatUrl,
  secondaryEmail,
  fullname,
}: EmailVerificationWaiting["variables"]) {
  const title = VerificationWaitingEmailTitle();

  return StandardLayout({
    title,
    children:
      MjmlText({}, `Hello ${fullname} ! 👋`) +
      MjmlText({}, "Ta fiche a été validée !") +
      MjmlText(
        {},
        "Et maintenant ? Connecte toi à l'espace-membre pour compléter tes informations et accéder aux différents outils de la communauté",
      ) +
      MjmlText(
        {},
        `<ul>
          <li>Étape 1 : Connecte toi sur <a href="${secretariatUrl}">l'espace membre</a> avec ton email ${secondaryEmail}</li>
          <li>Étape 2 : Complète tes informations</li>
        </ul>`,
      ) +
      MjmlButton({ href: secretariatUrl }, "Me connecter à l'espace-membre") +
      MjmlText({}, "Bonne journée"),
  });
}

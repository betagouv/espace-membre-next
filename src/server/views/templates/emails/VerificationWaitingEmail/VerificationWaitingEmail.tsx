import React from "react";

import { MjmlText, MjmlButton } from "@luma-team/mjml-react";

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

  return (
    <StandardLayout title={title}>
      <MjmlText>Hello {fullname} ! 👋</MjmlText>
      <MjmlText>Ta fiche a été validée !</MjmlText>
      <MjmlText>
        Et maintenant ? Connecte toi à l'espace-membre pour compléter tes
        informations et accéder aux différents outils de la communauté
      </MjmlText>
      <MjmlText>
        <ul>
          <li>
            Étape 1 : Connecte toi sur{" "}
            <a href={secretariatUrl}>l'espace membre</a> avec ton email{" "}
            {secondaryEmail}
          </li>
          <li>Étape 2 : Complète tes informations</li>
        </ul>
      </MjmlText>
      <MjmlButton href={secretariatUrl}>
        Me connecter à l'espace-membre
      </MjmlButton>
      <MjmlText>Bonne journée</MjmlText>
    </StandardLayout>
  );
}

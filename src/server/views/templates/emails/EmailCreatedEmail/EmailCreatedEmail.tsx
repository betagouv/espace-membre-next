import { MjmlText } from "@luma-team/mjml-react";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import { EmailCreatedEmail as EmailCreatedEmailType } from "@/server/modules/email";
export function EmailCreatedEmailTitle() {
  return "Ton email betagouv est prêt 🙂";
}

export function EmailCreatedEmail({
  email,
  secretariatUrl,
  secondaryEmail,
  emailUrl,
}: EmailCreatedEmailType["variables"]) {
  const title = EmailCreatedEmailTitle();

  return (
    <StandardLayout title={title}>
      <MjmlText>
        <h1>Ton email {email} est prêt !</h1>
        <p>Et maintenant ?</p>
        <ul>
          <li>
            Étape 1 : Connecte toi sur{" "}
            <a href={secretariatUrl}>l'espace membre</a> avec ton email{" "}
            {secondaryEmail}
          </li>
          <li>
            Etape 2 : Connecte toi à ta boite email @beta.gouv.fr sur le{" "}
            <a href={emailUrl}>Webmail</a>. Si tu souhaites utiliser un autre
            outil (Gmail, Outlook, …) tu peux le faire en suivant{" "}
            <a href="https://doc.incubateur.net/communaute/les-outils-de-la-communaute/emails">
              la doc
            </a>
            .
          </li>
        </ul>
        <p>Bonne journée</p>
      </MjmlText>
      <MjmlText></MjmlText>
    </StandardLayout>
  );
}

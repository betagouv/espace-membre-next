import { MjmlText } from "@luma-team/mjml-react";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import { EmailCreatedDimail as EmailCreatedDimailType } from "@/server/modules/email";
export function EmailCreatedDimailTitle() {
  return "Ta boite mail betagouv est prête 🙂";
}

export function EmailCreatedDimail({
  email,
  webmailUrl,
}: EmailCreatedDimailType["variables"]) {
  const title = EmailCreatedDimailTitle();

  return (
    <StandardLayout title={title}>
      <MjmlText>
        <h1>Ton email {email} est prêt !</h1>

        <p>Et maintenant ?</p>
        <ul>
          <li>
            Tu peux te connecter <a href={webmailUrl}>au webmail</a> avec le
            lien temporaire suivant, valable 1h :{" "}
            <a href={webmailUrl}>https://messagerie.numerique.gouv.fr</a>
          </li>
          <li>
            Tu peux également utiliser ProConnect avec ton compte {email} :
            <a href="https://messagerie.numerique.gouv.fr">
              https://messagerie.numerique.gouv.fr
            </a>
          </li>
        </ul>

        <p>
          Ton compte Mattermost (l'outil de discussion de la communauté) va être
          automatiquement créé d'ici 10 à 15 mins, tu recevras sur {email} les
          instructions pour y accéder.
        </p>

        <p>
          Dans les prochains jours tu recevras un email pour te présenter les
          prochaines étapes de ton embarquement au sein de la communauté.
        </p>

        <p>Bonne journée</p>
      </MjmlText>
      <MjmlText></MjmlText>
    </StandardLayout>
  );
}

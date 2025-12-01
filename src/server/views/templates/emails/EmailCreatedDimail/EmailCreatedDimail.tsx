import { MjmlText } from "@luma-team/mjml-react";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import { EmailCreatedDimail as EmailCreatedDimailType } from "@/server/modules/email";
export function EmailCreatedDimailTitle() {
  return "Ta boite mail betagouv est prête 🙂";
}

export function EmailCreatedDimail({
  email,
  password,
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
            Tu peux te connecter <a href={webmailUrl}>au webmail</a> avec ton
            email {email} et le mot de passe temporaire suivant :{" "}
            <strong>{password}</strong>
          </li>
          <li>
            Pour changer de mot de passe, va dans le webmail puis "Paramètres"
            &gt; "Tous les réglages" &gt; "Général" &gt; "Réglages avancés" &gt;
            "Changer le mot de passe". Pense à Générer un mot de passe complexe
            à l'aide de vaultwarden par exemple :)
          </li>
        </ul>

        <p>Bonne journée</p>
      </MjmlText>
      <MjmlText></MjmlText>
    </StandardLayout>
  );
}

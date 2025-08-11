import { MjmlText } from "@luma-team/mjml-react";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import { EmailCreatedDimail as EmailCreatedDimailType } from "@/server/modules/email";
export function EmailCreatedDimailTitle() {
  return "Ton boite mail betagouv est prêt 🙂";
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

        <p>Et maintenant ? Définis un nouveau mot de passe </p>
        <ul>
          <li>
            Étape 1 : Connecte toi sur <a href={webmailUrl}>l'espace membre</a>{" "}
            avec ton email {email} et le mot de passe suivant :{" "}
            <strong>{password}</strong>
          </li>
        </ul>

        <p>Bonne journée</p>
      </MjmlText>
      <MjmlText></MjmlText>
    </StandardLayout>
  );
}

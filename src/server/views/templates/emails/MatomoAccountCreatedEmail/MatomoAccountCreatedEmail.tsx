import { MjmlButton, MjmlText } from "@luma-team/mjml-react";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import { EmailMatomoAccountCreated } from "@/server/modules/email";

export function MatomoAccountCreatedEmailTitle() {
  return `Ton compte matomo vient d'être créé`;
}

export function MatomoAccountCreatedEmail({
  email,
  fullname,
  matomoResetUrl,
  newSite,
  sites,
}: EmailMatomoAccountCreated["variables"]) {
  const title = MatomoAccountCreatedEmailTitle();

  return (
    <StandardLayout title={title}>
      <MjmlText>
        <h1>{title}</h1>
        <p>Bonjour {fullname},</p>
        <p>Ton compte matomo vient d'être créé avec l'adresse {email}.</p>
        <p>
          Tu peux définir ton mot de passe en faisant une réinitialisation de
          mot de passe en cliquant sur le bouton ci-dessous, puis sur "Lost your
          password?".
        </p>
      </MjmlText>
      <MjmlButton href={matomoResetUrl}>
        Réinitialiser mon mot de passe Matomo
      </MjmlButton>
      <MjmlText>
        <p>
          Si le bouton ne fonctionne pas, tu peux utiliser ce lien :{" "}
          <a href={matomoResetUrl}>{matomoResetUrl}</a>
        </p>
        <p>Les accès aux sites suivant t'ont été donnés : </p>
        <ul>
          {newSite && <li>nouveau site : {newSite.url}</li>}
          {sites &&
            sites.map((s) => (
              <li key={s.id}>site existant avec l'identifiant : {s.id}</li>
            ))}
        </ul>
        <p>
          Tu trouveras dans cette documentation des astuces d'utilisation ainsi
          que les canaux intéressants à rejoindre :{" "}
          <a href="https://doc.incubateur.net/communaute/les-outils-de-la-communaute/autres-services/matomo">
            documentation Matomo
          </a>
        </p>

        <p>
          En cas de problème avec ton compte, n'hésite pas à répondre à ce mail
          !
        </p>

        <p>Bonne journée</p>
      </MjmlText>
      <MjmlText></MjmlText>
    </StandardLayout>
  );
}

import React from "react";

import { MjmlText, MjmlButton } from "@luma-team/mjml-react";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import { EmailLogin } from "@/lib/email/email";

export function LoginEmailTitle() {
  return `Connexion à l'espace membre BetaGouv`;
}

export const LoginEmail = ({
  loginUrlWithToken,
  fullname,
}: EmailLogin["variables"]) => {
  const title = LoginEmailTitle();

  return (
    <StandardLayout title={title}>
      <MjmlText>Hello {fullname}! 👋</MjmlText>
      <MjmlText>
        Tu as demandé un lien de connexion à l'espace membre. Pour
        t'authentifier, tu dois cliquer sur le bouton ci-dessous dans l'heure
        qui suit la réception de ce message.
      </MjmlText>
      <MjmlButton href={loginUrlWithToken}>Me connecter</MjmlButton>
      <MjmlText>
        Ou utiliser ce lien : <br />
        <a href={loginUrlWithToken}>{loginUrlWithToken}</a>
      </MjmlText>
      <MjmlText>
        En cas de problème avec ton compte, n'hésite pas à répondre à ce mail !
      </MjmlText>
      <MjmlText></MjmlText>
    </StandardLayout>
  );
};

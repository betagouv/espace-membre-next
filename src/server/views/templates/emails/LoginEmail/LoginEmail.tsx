import { MjmlText, MjmlButton } from "@/server/modules/mjml/mjml";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import { EmailLogin } from "@/server/modules/email";

export function LoginEmailTitle() {
  return `Connexion à l'espace membre BetaGouv`;
}

export const LoginEmail = ({
  loginUrlWithToken,
  fullname,
}: EmailLogin["variables"]) => {
  const title = LoginEmailTitle();

  return StandardLayout({
    title,
    children:
      MjmlText({}, `Hello ${fullname}! 👋`) +
      MjmlText(
        {},
        "Tu as demandé un lien de connexion à l'espace membre. Pour t'authentifier, tu dois cliquer sur le bouton ci-dessous dans l'heure qui suit la réception de ce message.",
      ) +
      MjmlButton({ href: loginUrlWithToken }, "Me connecter") +
      MjmlText(
        {},
        `Ou utiliser ce lien : <br /><a href="${loginUrlWithToken}">${loginUrlWithToken}</a>`,
      ) +
      MjmlText(
        {},
        "En cas de problème avec ton compte, n'hésite pas à répondre à ce mail !",
      ) +
      MjmlText({}, ""),
  });
};

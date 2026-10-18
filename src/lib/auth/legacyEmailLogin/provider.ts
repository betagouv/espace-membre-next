import EmailProvider from "next-auth/providers/email";

import { EMAIL_TYPES } from "@/lib/email/email";
import { sendEmail } from "@/server/config/email.config";

import { isLegacyEmailLoginEnabled } from "./config";

// next-auth's default id for the email provider
export const LEGACY_EMAIL_PROVIDER_ID = "email";

async function sendVerificationRequest({
  identifier,
  url,
}: {
  identifier: string;
  url: string;
}) {
  const urlObj = new URL(url);
  await sendEmail({
    type: EMAIL_TYPES.EMAIL_LOGIN,
    variables: {
      loginUrlWithToken: `${process.env.NEXTAUTH_URL}/signin${urlObj.search}`,
      fullname: "",
    },
    toEmail: [identifier],
  });
}

export const legacyEmailLoginProviders = () =>
  isLegacyEmailLoginEnabled()
    ? [
        EmailProvider({
          sendVerificationRequest,
          maxAge: 3600,
        }),
      ]
    : [];

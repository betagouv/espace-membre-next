import { routeTitles } from "@/lib/routes";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { LoginPage } from "@/components/LoginPage";
import { authOptions } from "@/lib/authoptions";
import { isFakeProConnectEnabled } from "@/lib/auth/fakeProConnect";
// legacy-email-login: remove with src/lib/auth/legacyEmailLogin
import { getLegacyEmailLoginConfig } from "@/lib/auth/legacyEmailLogin";

export const metadata: Metadata = {
  title: `${routeTitles.login()} / Espace Membre`,
};

async function Login() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (e) {
    // pass
  }
  if (session && session.user.id) {
    return redirect("/dashboard");
  }

  // legacy-email-login: remove with src/lib/auth/legacyEmailLogin
  const { mode, endDate } = getLegacyEmailLoginConfig();
  const legacyEmailLogin =
    mode === "off"
      ? null
      : {
          mode,
          endDate: endDate
            ? endDate.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "Europe/Paris",
              })
            : null,
        };

  return (
    <LoginPage
      fakeProConnect={isFakeProConnectEnabled()}
      // legacy-email-login: remove with src/lib/auth/legacyEmailLogin
      legacyEmailLogin={legacyEmailLogin}
    />
  );
}

export default Login;

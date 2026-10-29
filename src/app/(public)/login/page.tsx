import { routeTitles } from "@/lib/routes";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { LoginPage } from "@/components/LoginPage";
import { authOptions } from "@/lib/authoptions";
import { isFakeProConnectEnabled } from "@/lib/auth/fakeProConnect";
import { getRefusalFromLogoutState } from "@/lib/auth/proConnectLogout";
// legacy-email-login: remove with src/lib/auth/legacyEmailLogin
import { getLegacyEmailLoginConfig } from "@/lib/auth/legacyEmailLogin";

export const metadata: Metadata = {
  title: `${routeTitles.login()} / Espace Membre`,
};

async function Login(props: {
  searchParams: Promise<{ error?: string; state?: string }>;
}) {
  const { error, state } = await props.searchParams;
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (e) {
    // pass
  }
  // a member logged in by magic link who tried ProConnect must see why it was
  // refused, instead of being sent back to the dashboard
  if (
    session &&
    session.user.id &&
    !error &&
    !getRefusalFromLogoutState(state)
  ) {
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

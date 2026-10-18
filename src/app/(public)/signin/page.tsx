import { routeTitles } from "@/lib/routes";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import SignClientPage from "./SiginClientPage";
import { authOptions } from "@/lib/authoptions";
// legacy-email-login: remove this page with src/lib/auth/legacyEmailLogin
import { isLegacyEmailLoginEnabled } from "@/lib/auth/legacyEmailLogin";

export const metadata: Metadata = {
  title: `${routeTitles.signIn()} / Espace Membre`,
};

export default async function SignIn() {
  if (!isLegacyEmailLoginEnabled()) {
    return redirect("/login");
  }
  const session = await getServerSession(authOptions);

  if (session && session.user.id) {
    return redirect("/dashboard");
  }

  return <SignClientPage></SignClientPage>;
}

import { routeTitles } from "@/lib/routes";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { LoginPage } from "@/components/LoginPage";
import { authOptions } from "@/lib/authoptions";

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

  return <LoginPage />;
}

export default Login;

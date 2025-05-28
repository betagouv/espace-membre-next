import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { AdminProductClientPage } from "./AdminProductClientPage";
import { buildStartupDashboardData } from "@/server/schedulers/buildStartupDashboardData";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
  title: `${routeTitles.adminMattermost()} / Espace Membre`,
};

export default async function Page(props) {
  const session = await getServerSession(authOptions);

  if (session && !session.user.isAdmin) {
    redirect("/dashboard");
  }
  const data = await buildStartupDashboardData();
  return <AdminProductClientPage data={data} title={""} />;
}

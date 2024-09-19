import type { Metadata } from "next";

import { AdminProductClientPage } from "./AdminProductClientPage";
import { buildStartupDashboardData } from "@/server/schedulers/buildStartupDashboardData";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.adminMattermost()} / Espace Membre`,
};

export default async function Page(props) {
    const data = await buildStartupDashboardData();
    return <AdminProductClientPage data={data} title={""} />;
}

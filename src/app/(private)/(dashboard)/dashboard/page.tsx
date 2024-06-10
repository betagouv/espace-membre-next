import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { DashboardPage, DashboardPageProps } from "./DashboardPage";
import { DBUser, EmailStatusCode } from "@/models/dbUser";
import db from "@/server/db";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.dashboard()} / Espace Membre`,
};

export default async function Page(props: DashboardPageProps) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    const dbUser: DBUser = await db("users")
        .where({ username: session?.user?.id })
        .first();
    if (
        dbUser.primary_email_status ===
        EmailStatusCode.EMAIL_VERIFICATION_WAITING
    ) {
        return redirect("/verify");
    }

    return <DashboardPage {...props} />;
}

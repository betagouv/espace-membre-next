import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import AccountClientPage from "./AccountClientPage";
import { DBUser, EmailStatusCode } from "@/models/dbUser";
import db from "@/server/db";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.account()} / Espace Membre`,
};

export default async function Page() {
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
    return <AccountClientPage />;
}

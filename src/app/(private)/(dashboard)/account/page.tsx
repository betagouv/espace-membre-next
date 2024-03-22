import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AccountClientPage from "./AccountClientPage";
import { DBUser, EmailStatusCode } from "@/models/dbUser";
import config from "@/server/config";
import db from "@/server/db";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.account()} / Espace Membre`,
};

export default async function Page() {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    const dbUser: DBUser = await db("users")
        .where({ username: session.id })
        .first();
    if (
        dbUser.primary_email_status ===
        EmailStatusCode.EMAIL_VERIFICATION_WAITING
    ) {
        return redirect("/verify");
    }
    return <AccountClientPage />;
}

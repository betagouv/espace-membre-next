import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import AccountPage from "@/components/AccountPage/AccountPage";
import { getUserInfo } from "@/lib/kysely/queries";
import { EmailStatusCode } from "@/models/dbUser";
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
    const userInfos = await getUserInfo(session?.user?.id);

    if (
        !userInfos ||
        userInfos.primary_email_status ===
            EmailStatusCode.EMAIL_VERIFICATION_WAITING
    ) {
        return redirect("/verify");
    }
    return <AccountPage id={session?.user?.id} userInfos={userInfos} />;
}

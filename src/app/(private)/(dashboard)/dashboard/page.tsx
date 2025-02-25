import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { SURVEY_BOX_COOKIE_NAME } from "@/components/SurveyBox";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { getLatests as getLatestsMembers } from "@/lib/kysely/queries/users";
import { userInfosToModel } from "@/models/mapper";
import { EmailStatusCode } from "@/models/member";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

import { DashboardPage } from "@/components/Dashboard/DashboardPage";
import { getLatests as getLatestsStartups } from "@/lib/kysely/queries/startups";

export const metadata: Metadata = {
    title: `${routeTitles.dashboard()} / Espace Membre`,
};

export default async function Page(props) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    const userInfos = userInfosToModel(
        await getUserInfos({
            username: session?.user?.id,
            options: { withDetails: true },
        })
    );
    if (
        userInfos.primary_email_status ===
        EmailStatusCode.EMAIL_VERIFICATION_WAITING
    ) {
        return redirect("/verify");
    }

    const lastestProducts = await getLatestsStartups();
    const lastestMembers = await getLatestsMembers();
    const cookieStore = cookies();
    const surveyCookie = cookieStore.get(SURVEY_BOX_COOKIE_NAME);
    const surveyCookieValue = (surveyCookie && surveyCookie.value) || null;

    return (
        <DashboardPage
            {...props}
            surveyCookieValue={surveyCookieValue}
            latestProducts={lastestProducts}
            latestMembers={lastestMembers}
        />
    );
}

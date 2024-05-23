import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import AccountPage from "@/components/AccountPage/AccountPage";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { EmailStatusCode } from "@/models/dbUser";
import { DomaineSchemaType } from "@/models/member";
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
    const userInfos = await getUserInfos({
        username: session?.user?.id,
        options: { withDetails: true },
    });

    if (
        !userInfos ||
        userInfos.primary_email_status ===
            EmailStatusCode.EMAIL_VERIFICATION_WAITING
    ) {
        return redirect("/verify");
    }

    // todo: to make TS happy
    const domaine = userInfos.domaine as DomaineSchemaType;
    const userInfos2 = {
        ...userInfos,
        domaine,
    };

    return <AccountPage id={session?.user?.id} userInfos={userInfos2} />;
}

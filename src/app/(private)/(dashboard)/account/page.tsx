import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { getUserInformations } from "@/app/api/member/getInfo";
import MemberPage from "@/components/MemberPage/MemberPage";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import { userInfos } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.account()} / Espace Membre`,
};

export default async function Page() {
    // todo: merge with community/id/page
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    const id = session?.user?.id;

    let availableEmailPros: string[] = [];
    if (config.ESPACE_MEMBRE_ADMIN.includes(session.user.id)) {
        availableEmailPros = await betagouv.getAvailableProEmailInfos();
    }

    // compile some account informations
    const user = await userInfos({ username: id }, session.user.id === id);

    // compile some other infos
    const userInformations = await getUserInformations(id);

    if (!userInformations) {
        throw new Error("Cannot find user");
    }

    const isAdmin = !!session.user.isAdmin;

    return (
        <MemberPage
            isAdmin={isAdmin}
            availableEmailPros={availableEmailPros}
            authorizations={user.authorizations}
            emailInfos={user.emailInfos}
            isExpired={user.isExpired}
            redirections={user.emailRedirections}
            avatar={userInformations.avatar} // todo
            changes={userInformations.changes}
            emailResponder={userInformations.emailResponder}
            userInfos={userInformations.baseInfo}
            mattermostInfo={userInformations.mattermostInfo}
            matomoInfo={userInformations.matomoInfo}
            sentryInfo={userInformations.sentryInfo}
            startups={userInformations.startups}
            sessionUserIsFromIncubatorTeam={false}
            isCurrentUser={true}
            isWaitingValidation={false}
        />
    );
}

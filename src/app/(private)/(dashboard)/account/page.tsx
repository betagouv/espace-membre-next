import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import config from "@/server/config";
import { getMattermostUserInfo } from "@/lib/mattermost";

import { getUserInfos, getUserStartups } from "@/lib/kysely/queries/users";
import { memberChangeToModel, userInfosToModel } from "@/models/mapper";
import { EmailStatusCode } from "@/models/member";
import betagouv from "@/server/betagouv";
import {
    checkUserIsExpired,
    isPublicServiceEmail,
} from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";
import MemberPage from "@/components/MemberPage/MemberPage";
import { getEventListByUsername } from "@/lib/events";
import { getAvatarUrl } from "@/lib/s3";

export const metadata: Metadata = {
    title: `${routeTitles.account()} / Espace Membre`,
};

export default async function Page() {
    // todo: merge with community/id/page
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
    const emailInfos = await betagouv.emailInfos(userInfos.username);
    if (
        !userInfos ||
        userInfos.primary_email_status ===
            EmailStatusCode.EMAIL_VERIFICATION_WAITING
    ) {
        return redirect("/verify");
    }

    const emailRedirections = await betagouv.redirectionsForId({
        from: userInfos.username,
    });
    const emailResponder = await betagouv.getResponder(userInfos.username);
    let availableEmailPros: string[] = [];
    if (config.ESPACE_MEMBRE_ADMIN.includes(session.user.id)) {
        availableEmailPros = await betagouv.getAvailableProEmailInfos();
    }
    const isExpired = checkUserIsExpired(userInfos);
    const isCurrentUser = session.user.uuid === userInfos.uuid;
    const startups = await getUserStartups(userInfos.uuid);
    // On ne peut créé un compte que si:
    // - la page fiche Github existe
    // - le membre n'est pas expiré·e
    // - et le compte n'existe pas
    const canCreateEmail = !isExpired && emailInfos === null;
    // On peut créer une redirection & changer un password si:
    // - la page fiche Github existe
    // - le membre n'est pas expiré·e (le membre ne devrait de toute façon pas pouvoir se connecter)
    // - et que l'on est le membre connecté·e pour créer ces propres redirections.
    const canCreateRedirection = !!(!isExpired && isCurrentUser);
    const canChangePassword = !!(!isExpired && isCurrentUser && emailInfos);
    const canChangeEmails = !!(!isExpired && isCurrentUser);
    const hasPublicServiceEmail = userInfos.primary_email
        ? await isPublicServiceEmail(userInfos.primary_email)
        : false;
    const changes = await getEventListByUsername(userInfos.username);

    let { mattermostUser, mattermostUserInTeamAndActive } =
        await getMattermostUserInfo(userInfos.primary_email);
    const mattermostInfo = {
        hasMattermostAccount: !!mattermostUser,
        isInactiveOrNotInTeam: !mattermostUserInTeamAndActive,
        mattermostUserName: mattermostUser && mattermostUser.username,
    };
    const profileURL = await getAvatarUrl(userInfos.username);

    return (
        <MemberPage
            avatar={profileURL} // todo
            isAdmin={session.user.isAdmin}
            canEdit={isCurrentUser}
            changes={changes.map((change) => memberChangeToModel(change))}
            availableEmailPros={availableEmailPros}
            authorizations={{
                canCreateRedirection,
                canCreateEmail,
                canChangePassword,
                canChangeEmails,
                hasPublicServiceEmail,
            }}
            emailResponder={emailResponder}
            userInfos={userInfos}
            mattermostInfo={mattermostInfo}
            emailInfos={emailInfos}
            isExpired={isExpired}
            redirections={emailRedirections}
            startups={startups}
        />
    );
}

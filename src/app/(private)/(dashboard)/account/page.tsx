import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import AccountPage from "@/components/AccountPage/AccountPage";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { userInfosToModel } from "@/models/mapper";
import { EmailStatusCode } from "@/models/member";
import { memberSchemaType } from "@/models/member";
import betagouv from "@/server/betagouv";
import {
    checkUserIsExpired,
    isPublicServiceEmail,
} from "@/server/controllers/utils";
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
    const userInfos = userInfosToModel(
        await getUserInfos({
            username: session?.user?.id,
            options: { withDetails: true },
        })
    );
    const emailInfo = await betagouv.emailInfos(userInfos.username);
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

    const isExpired = checkUserIsExpired(userInfos);
    const isCurrentUser = session.user.uuid === userInfos.uuid;
    // On ne peut créé un compte que si:
    // - la page fiche Github existe
    // - le membre n'est pas expiré·e
    // - et le compte n'existe pas
    const canCreateEmail = !isExpired && emailInfo === null;
    // On peut créer une redirection & changer un password si:
    // - la page fiche Github existe
    // - le membre n'est pas expiré·e (le membre ne devrait de toute façon pas pouvoir se connecter)
    // - et que l'on est le membre connecté·e pour créer ces propres redirections.
    const canCreateRedirection = !!(!isExpired && isCurrentUser);
    const canChangePassword = !!(!isExpired && isCurrentUser && emailInfo);
    const canChangeEmails = !!(!isExpired && isCurrentUser);
    const hasPublicServiceEmail = userInfos.primary_email
        ? await isPublicServiceEmail(userInfos.primary_email)
        : false;
    return (
        <AccountPage
            isExpired={isExpired}
            userInfos={userInfos}
            emailResponder={emailResponder}
            authorizations={{
                canCreateEmail,
                canCreateRedirection,
                canChangePassword,
                canChangeEmails,
                hasPublicServiceEmail,
            }}
            emailInfos={emailInfo}
            emailRedirections={emailRedirections}
        />
    );
}

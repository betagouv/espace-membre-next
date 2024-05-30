import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { Missions } from "@/@types/db";
import AccountPage from "@/components/AccountPage/AccountPage";
import { getUserInfos } from "@/lib/kysely/queries/users";
import {
    CommunicationEmailCode,
    EmailStatusCode,
    GenderCode,
    LegalStatus,
} from "@/models/dbUser";
import { Domaine, memberSchemaType } from "@/models/member";
import { missionSchemaType } from "@/models/mission";
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

function userInfosToModel(
    user: Awaited<ReturnType<typeof getUserInfos>>
): memberSchemaType {
    if (!user) {
        throw new Error("No users");
    }
    return {
        ...user,
        username: user?.username || "",
        domaine: user.domaine as Domaine,
        primary_email_status: user.primary_email_status as EmailStatusCode,
        secondary_email: user.secondary_email || "",
        gender: user.gender as GenderCode,
        legal_status: user.legal_status as LegalStatus,
        communication_email:
            user.communication_email === CommunicationEmailCode.SECONDARY
                ? CommunicationEmailCode.SECONDARY
                : CommunicationEmailCode.PRIMARY,
        primary_email_status_updated_at:
            user.primary_email_status_updated_at || new Date(),
        missions: (user?.missions || []).map((mission) => ({
            ...mission,
        })),
    };
}

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
    const hasPublicServiceEmail = await isPublicServiceEmail(
        userInfos.primary_email
    );
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

import Button from "@codegouvfr/react-dsfr/Button";
import type { Metadata, ResolvingMetadata } from "next";
import { getServerSession } from "next-auth/next";

import { getUserInformations } from "@/app/api/member/getInfo";
import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import MemberPage from "@/components/MemberPage/MemberPage";
import { getUserEvents } from "@/lib/kysely/queries/userEvents";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import { isSessionUserIncubatorTeamAdminForUser } from "@/server/config/admin.config";
import { userInfos } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";

type Props = {
    params: { id: string };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = params.id;
    return {
        title: `Membre ${id} / Espace Membre`,
    };
}

export default async function Page({
    params: { id },
}: {
    params: { id: string };
}) {
    // todo: merge with /account/page.tsx
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }

    let availableEmailPros: string[] = [];
    if (config.ESPACE_MEMBRE_ADMIN.includes(session.user.id)) {
        availableEmailPros = await betagouv.getAvailableProEmailInfos();
    }

    // compile some account informations
    let user;
    try {
        user = await userInfos({ username: id }, session.user.id === id);
    } catch (e: any) {
        return (
            <>
                <BreadCrumbFiller currentPage="Invalide" currentItemId={null} />
                <h1>Ce membre est inconnu dans la communauté ou invalide</h1>
                <p>{(e && e.toString()) || ""}</p>
                <br />
                <Button linkProps={{ href: `/community` }}>
                    Explorer la communauté
                </Button>
            </>
        );
    }
    // compile some other infos
    const userInformations = await getUserInformations(id);

    if (!userInformations) {
        throw new Error("Cannot find user");
    }

    const isAdmin = !!session.user.isAdmin;
    const sessionUserIsFromIncubatorTeam =
        await isSessionUserIncubatorTeamAdminForUser({
            user: user.userInfos,
            sessionUserUuid: session.user.uuid,
        });
    const isCurrentUser = session.user.id === id;
    const userEvents =
        isAdmin || sessionUserIsFromIncubatorTeam
            ? await getUserEvents(user.userInfos.uuid)
            : [];

    return (
        <>
            <BreadCrumbFiller
                currentPage={user.userInfos.fullname}
                currentItemId={user.userInfos.username}
            />

            <MemberPage
                isAdmin={isAdmin}
                userEvents={userEvents}
                isCurrentUser={isCurrentUser}
                sessionUserIsFromIncubatorTeam={sessionUserIsFromIncubatorTeam}
                availableEmailPros={availableEmailPros}
                authorizations={user.authorizations}
                emailInfos={user.emailInfos}
                isExpired={user.isExpired}
                redirections={user.emailRedirections}
                avatar={userInformations?.avatar}
                changes={userInformations?.changes}
                emailResponder={userInformations.emailResponder}
                userInfos={userInformations?.baseInfo}
                mattermostInfo={userInformations.mattermostInfo}
                matomoInfo={userInformations.matomoInfo}
                sentryInfo={userInformations.sentryInfo}
                startups={userInformations.startups}
            />
        </>
    );
}

import type { Metadata, ResolvingMetadata } from "next";
import { getServerSession } from "next-auth/next";
import { userInfo } from "os";

import { getUserInformations } from "@/app/api/member/getInfo";
import MemberPage from "@/components/MemberPage/MemberPage";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
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

    const isAdmin = !!session.user.isAdmin;
    const canEdit = session.user.id === id;

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

    return (
        <MemberPage
            isAdmin={isAdmin}
            canEdit={canEdit}
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
    );
}

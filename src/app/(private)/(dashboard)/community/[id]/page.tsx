import * as Sentry from "@sentry/node";
import { compareDesc } from "date-fns/compareDesc";
import type { Metadata, ResolvingMetadata } from "next";
import { getServerSession } from "next-auth/next";

import MemberPage from "@/components/MemberPage/MemberPage";
import { getEventListByUsername } from "@/lib/events";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import { getMattermostUserInfo } from "@/lib/mattermost";
import { memberBaseInfoToModel, memberChangeToModel } from "@/models/mapper";
import { MattermostUser } from "@/models/mattermost";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import { userInfos } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import { getAvatarUrl } from "@/lib/s3";

type Props = {
    params: { id: string };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    // read route params
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

    const user = await userInfos({ username: id }, session.user.id === id);
    const dbUser = await getUserBasicInfo({ username: id });

    if (!dbUser) {
        return "User not found";
    }
    const memberBaseInfo = memberBaseInfoToModel(dbUser);
    let availableEmailPros: string[] = [];
    if (config.ESPACE_MEMBRE_ADMIN.includes(session.user.id)) {
        availableEmailPros = await betagouv.getAvailableProEmailInfos();
    }
    let { mattermostUser, mattermostUserInTeamAndActive } =
        await getMattermostUserInfo(dbUser?.primary_email);
    const startups = await getUserStartups(dbUser.uuid);
    const changes = await getEventListByUsername(id);
    const mattermostInfo = {
        hasMattermostAccount: !!mattermostUser,
        isInactiveOrNotInTeam: !mattermostUserInTeamAndActive,
        mattermostUserName: mattermostUser && mattermostUser.username,
    };
    const emailResponder = await betagouv.getResponder(id);
    const isAdmin = !!session.user.isAdmin;
    const canEdit = isAdmin || session.user.id === id;
    const profileURL = await getAvatarUrl(dbUser.username);

    return (
        <MemberPage
            avatar={profileURL} // todo
            isAdmin={isAdmin}
            canEdit={canEdit}
            changes={changes.map((change) => memberChangeToModel(change))}
            availableEmailPros={availableEmailPros}
            authorizations={user.authorizations}
            emailResponder={emailResponder}
            userInfos={memberBaseInfo}
            mattermostInfo={mattermostInfo}
            emailInfos={user.emailInfos}
            isExpired={user.isExpired}
            redirections={user.emailRedirections}
            startups={startups}
        />
    );
}

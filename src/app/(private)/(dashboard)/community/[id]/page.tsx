import * as Sentry from "@sentry/node";
import type { Metadata, ResolvingMetadata } from "next";
import { getServerSession } from "next-auth/next";

import MemberPage from "@/components/MemberPage/MemberPage";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import { getUserByEmail, searchUsers } from "@/lib/mattermost";
import { memberBaseInfoToModel } from "@/models/mapper";
import { MattermostUser } from "@/models/mattermost";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import { userInfos } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import { getEventListByUsername } from "@/lib/events";

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

const getMattermostUserInfo = async (
    dbUser
): Promise<{
    mattermostUser: MattermostUser | null;
    mattermostUserInTeamAndActive: boolean;
}> => {
    try {
        let mattermostUser = dbUser?.primary_email
            ? await getUserByEmail(dbUser.primary_email).catch((e) => null)
            : null;
        const [mattermostUserInTeamAndActive] = dbUser?.primary_email
            ? await searchUsers({
                  term: dbUser.primary_email,
                  team_id: config.mattermostTeamId,
                  allow_inactive: false,
              }).catch((e) => [])
            : [];
        return {
            mattermostUser,
            mattermostUserInTeamAndActive,
        };
    } catch (e) {
        Sentry.captureException(e);
        return {
            mattermostUser: null,
            mattermostUserInTeamAndActive: false,
        };
    }
};

export default async function Page({
    params: { id },
}: {
    params: { id: string };
}) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    const user = await userInfos({ username: id }, session.user.id === id);
    const hasGithubFile = user.userInfos;
    const hasEmailAddress =
        user.emailInfos || user.emailRedirections.length > 0;
    if (!hasGithubFile && !hasEmailAddress) {
        throw new Error(
            'Il n\'y a pas de membres avec ce compte mail. Vous pouvez commencez par créer une fiche sur Github pour la personne <a href="/onboarding">en cliquant ici</a>.'
        );
    }
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
        await getMattermostUserInfo(dbUser);
    const title = user.userInfos ? user.userInfos.fullname : null;
    const startups = await getUserStartups(dbUser.uuid);
    const changes = await getEventListByUsername(id);

    const mattermostInfo = {
        hasMattermostAccount: !!mattermostUser,
        isInactiveOrNotInTeam: !mattermostUserInTeamAndActive,
    };
    return (
        <MemberPage
            changes={changes}
            availableEmailPros={availableEmailPros}
            authorizations={user.authorizations}
            userInfos={memberBaseInfo}
            mattermostInfo={mattermostInfo}
            emailInfos={user.emailInfos}
            isExpired={user.isExpired}
            redirections={user.emailRedirections}
            startups={startups}
        />
    );
}

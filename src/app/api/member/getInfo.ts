import { getEventListByUsername } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import { getMattermostUserInfo } from "@/lib/mattermost";
import { getAvatarUrl } from "@/lib/s3";
import { memberChangeToModel, memberBaseInfoToModel } from "@/models/mapper";
import { matomoServiceInfoToModel } from "@/models/mapper/matomoMapper";
import betagouv from "@/server/betagouv";
import { SERVICES } from "@/server/config/services.config";

export const getUserInformations = async (id) => {
    // informations needed
    const dbUser = await getUserBasicInfo({ username: id });
    if (!dbUser) {
        return null;
    }
    const changes = (await getEventListByUsername(id)).map(memberChangeToModel);

    const avatar = await getAvatarUrl(dbUser.username);

    const baseInfo = memberBaseInfoToModel(dbUser);

    let { mattermostUser, mattermostUserInTeamAndActive } =
        await getMattermostUserInfo(dbUser?.primary_email);
    const startups = await getUserStartups(dbUser.uuid);

    const mattermostInfo = {
        hasMattermostAccount: !!mattermostUser,
        isInactiveOrNotInTeam: !mattermostUserInTeamAndActive,
        mattermostUserName: mattermostUser && mattermostUser.username,
    };

    const matomoInfo = (
        await db
            .selectFrom("service_accounts")
            .where("user_id", "=", dbUser.uuid)
            .where("account_type", "=", SERVICES.MATOMO)
            .execute()
    ).map((m) => matomoServiceInfoToModel(m));

    const emailResponder = await betagouv.getResponder(id);

    return {
        id,
        changes,
        avatar,
        baseInfo,
        startups,
        mattermostInfo,
        matomoInfo,
        emailResponder,
    };
};

import { getEventListByUsername } from "@/lib/events";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import { getMattermostUserInfo } from "@/lib/mattermost";
import { getAvatarUrl } from "@/lib/s3";
import { memberChangeToModel, memberBaseInfoToModel } from "@/models/mapper";
import betagouv from "@/server/betagouv";

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

    const emailResponder = await betagouv.getResponder(id);

    return {
        id,
        changes,
        avatar,
        baseInfo,
        startups,
        mattermostInfo,
        matomoInfo: undefined,
        emailResponder,
    };
};

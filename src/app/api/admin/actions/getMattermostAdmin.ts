"use server";

import { getServerSession } from "next-auth/next";

import { MattermostChannel } from "@/lib/mattermost";
import config from "@/server/config";
import { authOptions } from "@/utils/authoptions";
import {
    AuthorizationError,
    UnwrapPromise,
    withErrorHandling,
} from "@/utils/error";
import { getAllChannels } from "@infra/chat";
import {
    MattermostUserWithStatus,
    getMattermostUsersWithStatus,
} from "@schedulers/mattermostScheduler/removeBetaAndParnersUsersFromCommunityTeam";

export async function getMattermostInfo() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    if (!session.user.isAdmin) {
        throw new AuthorizationError(`L'utilisateur doit être administrateur`);
    }

    let users: MattermostUserWithStatus[] = [];

    if (process.env.NODE_ENV === "production") {
        users = await getMattermostUsersWithStatus({
            nbDays: 90,
        });
    }

    const channels: MattermostChannel[] = await getAllChannels(
        config.mattermostTeamId
    );
    try {
        const title = "Admin Mattermost";
        return {
            title,
            users,
            channelOptions: channels.map((channel) => ({
                value: channel.name,
                label: channel.display_name,
            })),
            currentUserId: session.user.id,
            isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(session.user.id),
        };
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export const safeGetMattermostInfo = withErrorHandling<
    UnwrapPromise<ReturnType<typeof getMattermostInfo>>,
    Parameters<typeof getMattermostInfo>
>(getMattermostInfo);

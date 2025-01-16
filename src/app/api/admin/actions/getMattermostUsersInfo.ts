"use server";

import { getServerSession } from "next-auth/next";

import { addEvent } from "@/lib/events";
import { MattermostChannel } from "@/lib/mattermost";
import { EventCode } from "@/models/actionEvent/actionEvent";
("use server");

import { MattermostUser } from "@/models/mattermost";
import { getMattermostUsers } from "@/server/controllers/adminController";
import { authOptions } from "@/utils/authoptions";
import { AuthorizationError } from "@/utils/error";

export const getMattermostUsersInfo = async ({
    fromBeta,
    excludeEmails,
    includeEmails,
}: {
    fromBeta: boolean;
    excludeEmails?: string[];
    includeEmails?: string[];
}) => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    if (!session.user.isAdmin) {
        throw new AuthorizationError(`L'utilisateur doit être administrateur`);
    }

    const users: MattermostUser[] = await getMattermostUsers({
        fromBeta,
        excludeEmails: excludeEmails || [],
        includeEmails: includeEmails || [],
    });
    return {
        users,
    };
};

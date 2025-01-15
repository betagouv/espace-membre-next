"use server";

import { getServerSession } from "next-auth/next";

import { addEvent } from "@/lib/events";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import { buildBetaEmail, userInfos } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import {
    AuthorizationError,
    UnwrapPromise,
    withErrorHandling,
} from "@/utils/error";

export async function upgradeEmailForUser({
    username,
    password,
}: {
    username: string;
    password: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    const isCurrentUser = session.user.id === username;

    if (!config.ESPACE_MEMBRE_ADMIN.includes(session.user.id)) {
        throw new Error(
            `Vous n'etes pas admin vous ne pouvez pas upgrade ce compte.`
        );
    }
    if (!config.OVH_EMAIL_PRO_NAME) {
        throw new Error(`OVH email pro account is not defined`);
    }

    const availableProEmail: string[] =
        await betagouv.getAvailableProEmailInfos();
    if (!availableProEmail.length) {
        throw new Error(`
                Il n'y a plus d'email pro disponible
            `);
    }
    const user = await userInfos({ username }, isCurrentUser);

    if (user.isExpired) {
        throw new Error(
            `Le compte "${username}" est expiré, vous ne pouvez pas upgrade ce compte.`
        );
    }

    if (!user.emailInfos) {
        throw new Error(`Le compte "${username}" n'a pas de compte email`);
    }

    if (user.emailInfos.emailPlan === EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO) {
        throw new Error(`Le compte "${username}" est déjà un compte pro.`);
    }

    await betagouv.migrateEmailAccount({
        userId: user.emailInfos.email.split("@")[0],
        destinationEmailAddress: availableProEmail[0],
        destinationServiceName: config.OVH_EMAIL_PRO_NAME,
        password,
    });

    await betagouv.sendInfoToChat(
        `Upgrade de compte de ${username} (à la demande de ${session.user.id})`
    );
    addEvent({
        action_code: EventCode.MEMBER_EMAIL_UPGRADED,
        created_by_username: session.user.id,
        action_on_username: username,
    });
}

export const safeUpgradeEmailForUser = withErrorHandling<
    UnwrapPromise<ReturnType<typeof upgradeEmailForUser>>,
    Parameters<typeof upgradeEmailForUser>
>(upgradeEmailForUser);

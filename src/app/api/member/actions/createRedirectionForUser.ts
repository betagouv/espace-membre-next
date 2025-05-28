"use server";

import { getServerSession } from "next-auth/next";

import { addEvent } from "@/lib/events";
import { EventCode } from "@/models/actionEvent/actionEvent";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import { buildBetaEmail, userInfos } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import {
    AuthorizationError,
    UnwrapPromise,
    withErrorHandling,
} from "@/utils/error";

export async function createRedirectionForUser({
    username,
    to_email,
    keep_copy,
}: {
    username: string;
    to_email: string;
    keep_copy?: boolean;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    const isCurrentUser = session.user.id === username;
    const user = await userInfos({ username }, isCurrentUser);

    // TODO: généraliser ce code dans un `app.param("id")` ?
    if (!user.userInfos) {
        throw new Error(
            `Le membre ${username} n'a pas de fiche membre : vous ne pouvez pas créer de redirection.`,
        );
    }

    if (user.isExpired) {
        throw new Error(`Le compte du membre ${username} est expiré.`);
    }

    if (!user.authorizations.canCreateRedirection) {
        throw new Error("Vous n'avez pas le droit de créer de redirection.");
    }

    console.log(
        `Création d'une redirection d'email id=${session.user.id}&from_email=${username}&to_email=${to_email}&keep_copy=${keep_copy}`,
    );

    const secretariatUrl = `${config.protocol}://${config.host}`;

    const message = `À la demande de ${session.user.id} sur <${secretariatUrl}>, je crée une redirection mail pour ${username}`;

    try {
        await addEvent({
            action_code: EventCode.MEMBER_REDIRECTION_CREATED,
            created_by_username: session.user.id,
            action_on_username: username,
            action_metadata: {
                value: to_email,
            },
        });
        await betagouv.sendInfoToChat(message);
        await betagouv.createRedirection(
            buildBetaEmail(username),
            to_email,
            keep_copy === true,
        );
    } catch (err) {
        console.log(err);
        throw new Error(`Erreur pour créer la redirection: ${err}`);
    }
}

export const safeCreateRedirectionForUser = withErrorHandling<
    UnwrapPromise<ReturnType<typeof createRedirectionForUser>>,
    Parameters<typeof createRedirectionForUser>
>(createRedirectionForUser);

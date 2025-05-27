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

export async function deleteRedirectionForUser({
    username,
    toEmail,
}: {
    username: string;
    toEmail: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    const isCurrentUser = session.user.id === username;
    const user = await userInfos({ username }, isCurrentUser);

    // TODO: vérifier si le membre existe sur Github ?

    if (!user.authorizations.canCreateRedirection) {
        throw new Error(
            "Vous n'avez pas le droit de supprimer cette redirection.",
        );
    }

    console.log(
        `Suppression de la redirection by=${username}&to_email=${toEmail}`,
    );

    const secretariatUrl = `${config.protocol}://${config.host}`;

    const message = `À la demande de ${session.user.id} sur <${secretariatUrl}>, je supprime la redirection mail de ${username} vers ${toEmail}`;

    try {
        await addEvent({
            action_code: EventCode.MEMBER_REDIRECTION_DELETED,
            created_by_username: session.user.id,
            action_on_username: username,
            action_metadata: {
                value: toEmail,
            },
        });
        await betagouv.sendInfoToChat(message);
        await betagouv.deleteRedirection(buildBetaEmail(username), toEmail);
    } catch (err) {
        throw new Error(`Erreur pour supprimer la redirection: ${err}`);
    }
}

export const safeDeleteRedirectionForUser = withErrorHandling<
    UnwrapPromise<ReturnType<typeof deleteRedirectionForUser>>,
    Parameters<typeof deleteRedirectionForUser>
>(deleteRedirectionForUser);

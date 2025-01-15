"use server";

import { getServerSession } from "next-auth/next";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { EmailStatusCode } from "@/models/member";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import { buildBetaEmail, userInfos } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import {
    AuthorizationError,
    UnwrapPromise,
    withErrorHandling,
} from "@/utils/error";

export async function updatePasswordForUser({
    username,
    new_password,
}: {
    username: string;
    new_password: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    const isCurrentUser = session.user.id === username;
    const user = await userInfos({ username }, isCurrentUser);

    if (!user.userInfos) {
        throw new Error(
            `Le membre ${username} n'a pas de fiche sur l'espace-membre : vous ne pouvez pas modifier le mot de passe.`
        );
    }

    if (user.isExpired) {
        throw new Error(`Le compte du membre ${username} est expiré.`);
    }

    if (!user.authorizations.canChangePassword) {
        throw new Error("Vous n'avez pas le droit de changer le mot de passe.");
    }

    const password = new_password;

    if (
        !password ||
        password.length < 9 ||
        password.length > 30 ||
        password !== password.trim()
    ) {
        throw new Error(
            "Le mot de passe doit comporter de 9 à 30 caractères, ne pas contenir d'accents ni d'espace au début ou à la fin."
        );
    }
    const email = buildBetaEmail(username);

    console.log(
        `Changement de mot de passe by=${session.user.id}&email=${email}`
    );

    const secretariatUrl = `${config.protocol}://${config.host}`;
    await betagouv.changePassword(
        username,
        password,
        user.emailInfos?.emailPlan
    );
    await addEvent({
        action_code: EventCode.MEMBER_PASSWORD_UPDATED,
        created_by_username: session.user.id,
        action_on_username: username,
    });
    if (
        [
            EmailStatusCode.EMAIL_SUSPENDED,
            EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING,
        ].includes(user.userInfos.primary_email_status)
    ) {
        await db
            .updateTable("users")
            .where("username", "=", username)
            .set({
                primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
                primary_email_status_updated_at: new Date(),
            })
            .execute();
    }
    const message = `À la demande de ${session.user.id} sur <${secretariatUrl}>, je change le mot de passe pour ${username}.`;
    await betagouv.sendInfoToChat(message);
}

export const safeUpdatePasswordForUser = withErrorHandling<
    UnwrapPromise<ReturnType<typeof updatePasswordForUser>>,
    Parameters<typeof updatePasswordForUser>
>(updatePasswordForUser);

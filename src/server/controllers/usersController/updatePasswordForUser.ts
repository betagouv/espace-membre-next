import { addEvent } from "@/lib/events";
import { EventCode } from "@/models/actionEvent";
import { DBUser, EmailStatusCode } from "@/models/dbUser/dbUser";
import config from "@/server/config";
import BetaGouv from "@betagouv";
import * as utils from "@controllers/utils";
import knex from "@db/index";

export async function updatePasswordForUserApi(req, res) {
    updatePasswordForUserHandler(
        req,
        res,
        () => {
            res.json({
                success: true,
            });
        },
        () => {
            res.status(500).json({
                error: req.flash("error"),
            });
        }
    );
}

export async function updatePasswordForUser(req, res) {
    updatePasswordForUserHandler(
        req,
        res,
        (url) => {
            res.redirect(url);
        },
        (url) => {
            res.redirect(url);
        }
    );
}

export async function updatePasswordForUserHandler(
    req,
    res,
    onSuccess,
    onError
) {
    const { username } = req.params;
    const isCurrentUser = req.auth.id === username;
    try {
        const user = await utils.userInfos(username, isCurrentUser);

        if (!user.userInfos) {
            throw new Error(
                `Le membre ${username} n'a pas de fiche sur Github : vous ne pouvez pas modifier le mot de passe.`
            );
        }

        if (user.isExpired) {
            throw new Error(`Le compte du membre ${username} est expiré.`);
        }

        if (!user.canChangePassword) {
            throw new Error(
                "Vous n'avez pas le droit de changer le mot de passe."
            );
        }

        const password = req.body.new_password;

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
        const dbUser: DBUser = await knex("users").where({ username }).first();
        const email = utils.buildBetaEmail(username);

        console.log(
            `Changement de mot de passe by=${req.auth.id}&email=${email}`
        );

        const secretariatUrl = `${config.protocol}://${req.get("host")}`;
        await BetaGouv.changePassword(
            username,
            password,
            user.emailInfos?.emailPlan
        );
        await addEvent({
            action_code: EventCode.MEMBER_PASSWORD_UPDATED,
            created_by_username: req.auth.id,
            action_on_username: username,
        });
        if (
            [
                EmailStatusCode.EMAIL_SUSPENDED,
                EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING,
            ].includes(dbUser.primary_email_status)
        ) {
            await knex("users").where({ username }).update({
                primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
                primary_email_status_updated_at: new Date(),
            });
            await knex("user_details")
                .where({ hash: utils.computeHash(username) })
                .update({
                    active: true,
                });
        }
        const message = `À la demande de ${req.auth.id} sur <${secretariatUrl}>, je change le mot de passe pour ${username}.`;
        await BetaGouv.sendInfoToChat(message);
        req.flash("message", "Le mot de passe a bien été modifié.");
        onSuccess(`/community/${username}`);
    } catch (err) {
        console.error(err);

        if (err instanceof Error) {
            req.flash("error", err.message);
        }
        onError(`/community/${username}`);
    }
}

import config from "@/config";
import BetaGouv from "@/betagouv";
import * as utils from "@/controllers/utils";
import { addEvent, EventCode } from "@/lib/events";

export async function createRedirectionForUser(req, res) {
    const { username } = req.params;
    const isCurrentUser = req.auth.id === username;

    try {
        const user = await utils.userInfos(username, isCurrentUser);

        // TODO: généraliser ce code dans un `app.param("id")` ?
        try {
            if (!user.userInfos) {
                throw new Error(
                    `Le membre ${username} n'a pas de fiche sur Github : vous ne pouvez pas créer de redirection.`
                );
            }

            if (user.isExpired) {
                throw new Error(`Le compte du membre ${username} est expiré.`);
            }

            if (!user.canCreateRedirection) {
                throw new Error(
                    "Vous n'avez pas le droit de créer de redirection."
                );
            }
        } catch (err) {
            return res.json(
                {
                    message: err.message,
                },
                {
                    status: "401",
                }
            );
        }

        console.log(
            `Création d'une redirection d'email id=${req.auth.id}&from_email=${username}&to_email=${req.body.toEmail}&keep_copy=${req.body.keepCopy}`
        );

        const secretariatUrl = `${config.protocol}://${config.host}`;

        const message = `À la demande de ${req.auth.id} sur <${secretariatUrl}>, je crée une redirection mail pour ${username}`;

        try {
            addEvent(EventCode.MEMBER_REDIRECTION_CREATED, {
                created_by_username: req.auth.id,
                action_on_username: username,
                action_metadata: {
                    value: req.body.toEmail,
                },
            });
            if (process.env.NODE_ENV !== "development") {
                await BetaGouv.sendInfoToChat(message);
            }
            await BetaGouv.createRedirection(
                utils.buildBetaEmail(username),
                req.body.toEmail,
                req.body.keepCopy
            );
        } catch (err) {
            throw new Error(`Erreur pour créer la redirection: ${err}`);
        }
        // req.flash("message", "La redirection a bien été créé.");
        return res.json({
            message: "La redirection a bien été créé.",
        });
        if (isCurrentUser) {
            res.redirect("/account");
        } else {
            res.redirect(`/community/${username}`);
        }
    } catch (err) {
        console.error(err);
        // req.flash("error", err.message);
        return res.json(
            {
                message: err.message,
            },
            {
                status: "500",
            }
        );
        if (isCurrentUser) {
            res.redirect("/account");
        } else {
            res.redirect(`/community/${username}`);
        }
    }
}

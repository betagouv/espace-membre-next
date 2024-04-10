import { addEvent } from "@/lib/events";
import { EventCode } from "@/models/actionEvent";
import config from "@/server/config";
import BetaGouv from "@betagouv";
import betagouv from "@betagouv";
import * as utils from "@controllers/utils";

export async function upgradeEmailForUserApi(req, res) {
    upgradeEmailForUserHandler(
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

export async function upgradeEmailForUser(req, res) {
    upgradeEmailForUserHandler(
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

export async function upgradeEmailForUserHandler(req, res, onSuccess, onError) {
    const { username } = req.params;
    const isCurrentUser = req.auth.id === username;
    const password = req.body.password;

    if (!config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id)) {
        throw new Error(
            `Vous n'etes pas admin vous ne pouvez pas upgrade ce compte.`
        );
    }
    if (!config.OVH_EMAIL_PRO_NAME) {
        throw new Error(`OVH email pro account is not defined`);
    }

    try {
        const availableProEmail: string[] =
            await betagouv.getAvailableProEmailInfos();
        if (!availableProEmail.length) {
            throw new Error(`
                Il n'y a plus d'email pro disponible
            `);
        }
        const user = await utils.userInfos(username, isCurrentUser);

        if (user.isExpired) {
            throw new Error(
                `Le compte "${username}" est expiré, vous ne pouvez pas upgrade ce compte.`
            );
        }

        if (!user.emailInfos) {
            throw new Error(`Le compte "${username}" n'a pas de compte email`);
        }

        if (user.emailInfos.isPro) {
            throw new Error(`Le compte "${username}" est déjà un compte pro.`);
        }

        await betagouv.migrateEmailAccount({
            userId: user.emailInfos.email.split("@")[0],
            destinationEmailAddress: availableProEmail[0],
            destinationServiceName: config.OVH_EMAIL_PRO_NAME,
            password,
        });

        await BetaGouv.sendInfoToChat(
            `Upgrade de compte de ${username} (à la demande de ${req.auth.id})`
        );
        addEvent({
            action_code: EventCode.MEMBER_EMAIL_UPGRADED,
            created_by_username: req.auth.id,
            action_on_username: username,
        });

        req.flash(
            "message",
            `Le compte email de ${username} est en cours d'upgrade.`
        );
        onSuccess(`/community/${username}`);
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            req.flash("error", err.message);
        }
        onError(`/community/${username}`);
    }
}

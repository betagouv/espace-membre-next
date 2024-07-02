import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent";
import config from "@/server/config";
import * as utils from "@controllers/utils";

export async function manageSecondaryEmailForUserApi(req, res) {
    manageSecondaryEmailForUserHandler(
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

export async function manageSecondaryEmailForUser(req, res) {
    const { username } = req.params;
    manageSecondaryEmailForUserHandler(
        req,
        res,
        () => {
            res.redirect(`/community/${username}`);
        },
        () => {
            res.redirect(`/community/${username}`);
        }
    );
}

export async function manageSecondaryEmailForUserHandler(
    req,
    res,
    onSuccess,
    onError
) {
    const { username } = req.params;
    const isCurrentUser = req.auth.id === username;
    const { secondaryEmail } = req.body;
    const user = await utils.userInfos({ username }, isCurrentUser);
    try {
        if (
            user.authorizations.canChangeEmails ||
            config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id)
        ) {
            const user = await db
                .selectFrom("users")
                .select("secondary_email")
                .where("username", "=", username)
                .executeTakeFirst();

            if (!user) {
                throw new Error("Users not found");
            }

            await db
                .updateTable("users")
                .set({
                    secondary_email: secondaryEmail,
                })
                .where("username", "=", username)
                .execute();

            await addEvent({
                action_code: EventCode.MEMBER_SECONDARY_EMAIL_UPDATED,
                created_by_username: req.auth.id,
                action_on_username: username,
                action_metadata: {
                    value: secondaryEmail,
                    old_value: user.secondary_email || "",
                },
            });
            req.flash(
                "message",
                "Ton compte email secondaire a bien mis à jour."
            );
            console.log(
                `${req.auth.id} a mis à jour son adresse mail secondaire.`
            );
            onSuccess();
        }
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            req.flash("error", err.message);
        }
        onError();
    }
}

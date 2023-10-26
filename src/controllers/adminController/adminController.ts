import PromiseMemoize from "promise-memoize";
import config from "@/config";
import BetaGouv from "../../betagouv";
import * as utils from "../utils";
import { AdminPage } from "../../views";
import betagouv from "../../betagouv";
import { getBetaEmailId, isBetaEmail } from "../utils";

const emailWithMetadataMemoized = PromiseMemoize(
    async () => {
        const [accounts, redirections, users] = await Promise.all([
            BetaGouv.accounts(),
            BetaGouv.redirections(),
            BetaGouv.usersInfos(),
        ]);

        const emails = Array.from(
            new Set([
                ...redirections.reduce(
                    (acc, r) => (!isBetaEmail(r.to) ? [...acc, r.from] : acc),
                    []
                ),
                ...accounts.map(utils.buildBetaEmail),
            ])
        ).sort();

        return emails.map((email) => {
            const id = getBetaEmailId(email);
            const user = users.find((ui) => ui.id === id);

            return {
                id,
                email,
                github: user !== undefined,
                redirections: redirections.reduce(
                    (acc, r) => (r.from === email ? [...acc, r.to] : acc),
                    []
                ),
                account: accounts.includes(id),
                endDate: user ? user.end : undefined,
                expired:
                    user &&
                    user.end &&
                    new Date(user.end).getTime() < new Date().getTime(),
            };
        });
    },
    {
        maxAge: 120000,
    }
);

export async function getEmailLists(req, res) {
    try {
        const emails = await emailWithMetadataMemoized();
        const expiredEmails = emails.filter((user) => user.expired);
        const users = await betagouv.usersInfos();
        const title = "Administration";
        res.send(
            AdminPage({
                request: req,
                title,
                currentUserId: req.auth.id,
                users: users.splice(0, 100),
                emails,
                isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
                expiredEmails,
                activeTab: "admin",
                errors: req.flash("error"),
                messages: req.flash("message"),
            })
        );
    } catch (err) {
        console.error(err);
        req.flash("error", "Erreur interne");
        res.redirect("/account");
    }
}

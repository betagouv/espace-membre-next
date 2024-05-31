import * as Sentry from "@sentry/node";

import * as utils from "./utils";
import BetaGouv from "../betagouv";
import betagouv from "../betagouv";
import config from "../config";
import knex from "../db";
import { getAllStartups } from "../db/dbStartup";
import { getAllUsersPublicInfo } from "../db/dbUser";
import { db } from "@/lib/kysely";
import { MattermostUser, getUserByEmail, searchUsers } from "@/lib/mattermost";
import { DBUser, EmailStatusCode } from "@/models/dbUser";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";
import { getContactInfo } from "@/server/config/email.config";

export async function getCommunityApi(req, res) {
    getCommunityPageData(
        req,
        res,
        (data) => {
            res.json({
                ...data,
            });
        },
        (err) => {
            res.status(500).json({
                error: "Erreur interne : impossible de récupérer les informations de la communauté",
            });
        }
    );
}

export async function getCommunityPageData(req, res, onSuccess, onError) {
    if (req.query.username) {
        return res.redirect(`/community/${req.query.username}`);
    }

    try {
        const users = await getAllUsersPublicInfo();
        const incubators = await db
            .selectFrom("incubators")
            .selectAll()
            .execute();
        const startups = await getAllStartups();
        const title = "Communauté";
        return onSuccess({
            title,
            currentUserId: req.auth.id,
            incubatorOptions: Object.keys(incubators).map((incubator) => {
                return {
                    value: incubator,
                    label: incubators[incubator].title,
                };
            }),
            startupOptions: startups.map((startup) => {
                return {
                    value: startup.id,
                    label: startup.name,
                };
            }),
            isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
            domaineOptions: [
                {
                    value: "ANIMATION",
                    label: "Animation",
                },
                {
                    value: "COACHING",
                    label: "Coaching",
                },
                {
                    value: "DEPLOIEMENT",
                    label: "Déploiement",
                },
                {
                    value: "DESIGN",
                    label: "Design",
                },
                {
                    value: "DEVELOPPEMENT",
                    label: "Développement",
                },
                {
                    value: "INTRAPRENARIAT",
                    label: "Intraprenariat",
                },
                {
                    value: "PRODUIT",
                    label: "Produit",
                },
                {
                    value: "AUTRE",
                    label: "Autre",
                },
            ],
            users: users.map((user) => ({
                ...user,
                id: user.username,
            })),
            activeTab: "community",
        });
    } catch (err) {
        onError(err);
    }
}

export async function getUserApi(req, res) {
    getUserPageData(
        req,
        res,
        (data) => {
            res.json(data);
        },
        (err) => {
            res.status(500).json({
                error: err,
            });
        }
    );
}

export async function getUser(req, res) {
    getUserPageData(
        req,
        res,
        (data) => {
            res.render("user", data);
        },
        (err) => {
            console.error(err);
            req.flash("error", err);
            res.redirect("/community");
        }
    );
}

const getMattermostUserInfo = async (
    dbUser
): Promise<{
    mattermostUser: MattermostUser | null;
    mattermostUserInTeamAndActive: boolean;
}> => {
    try {
        let mattermostUser = dbUser?.primary_email
            ? await getUserByEmail(dbUser.primary_email).catch((e) => null)
            : null;
        const [mattermostUserInTeamAndActive] = dbUser?.primary_email
            ? await searchUsers({
                  term: dbUser.primary_email,
                  team_id: config.mattermostTeamId,
                  allow_inactive: false,
              }).catch((e) => [])
            : [];
        return {
            mattermostUser,
            mattermostUserInTeamAndActive,
        };
    } catch (e) {
        Sentry.captureException(e);
        return {
            mattermostUser: null,
            mattermostUserInTeamAndActive: false,
        };
    }
};

async function getUserPageData(req, res, onSuccess, onError) {
    const { username } = req.params;
    const isCurrentUser = req.auth.id === username;

    try {
        const user = await utils.userInfos(username, isCurrentUser);

        const hasGithubFile = user.userInfos;
        const hasEmailAddress = user.emailInfos || user.redirections.length > 0;
        if (!hasGithubFile && !hasEmailAddress) {
            req.flash("error");
            onError(
                'Il n\'y a pas de membres avec ce compte mail. Vous pouvez commencez par créer une fiche sur Github pour la personne <a href="/onboarding">en cliquant ici</a>.'
            );
            return;
        }

        const dbUser: DBUser | undefined = await knex("users")
            .where({ username })
            .first();
        const primaryEmail = dbUser ? dbUser.primary_email : "";
        const secondaryEmail = dbUser ? dbUser.secondary_email : "";
        let availableEmailPros: string[] = [];
        if (config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id)) {
            availableEmailPros = await betagouv.getAvailableProEmailInfos();
        }
        let { mattermostUser, mattermostUserInTeamAndActive } =
            await getMattermostUserInfo(dbUser);
        const title = user.userInfos ? user.userInfos.fullname : null;
        onSuccess({
            title,
            username,
            currentUserId: req.auth.id,
            emailInfos: user.emailInfos,
            redirections: user.redirections,
            userInfos: user.userInfos,
            isExpired: user.isExpired,
            isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
            availableEmailPros,
            mattermostInfo: {
                hasMattermostAccount: !!mattermostUser,
                isInactiveOrNotInTeam: !mattermostUserInTeamAndActive,
            },
            primaryEmail,
            primaryEmailStatus: dbUser
                ? dbUser.primary_email_status
                : EmailStatusCode.EMAIL_UNSET,
            canCreateEmail: user.canCreateEmail,
            hasPublicServiceEmail:
                dbUser &&
                dbUser.primary_email &&
                !dbUser.primary_email.includes(config.domain),
            errors: req.flash("error"),
            messages: req.flash("message"),
            domain: config.domain,
            activeTab: "community",
            secondaryEmail,
        });
    } catch (err) {
        onError(err);
    }
}

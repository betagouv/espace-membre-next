import { fetchCommuneDetails } from "@/lib/searchCommune";
import {
    DBUserDetail,
    DBUser,
    statusOptions,
    genderOptions,
} from "@/models/dbUser/dbUser";
import { EmailStatusCode } from "@/models/dbUser/dbUser";
import { PULL_REQUEST_STATE } from "@/models/pullRequests";
import config from "@/server/config";
import betagouv from "@betagouv";
import * as utils from "@controllers/utils";
import db from "@db";

const getAccount = async (req, res, onSuccess, onError) => {
    try {
        const [currentUser, marrainageState, dbUser, dbUserDetail] =
            await Promise.all([
                utils.userInfos(req.auth.id, true),
                (async (): Promise<string> => {
                    const [state] = await db("marrainage").where({
                        username: req.auth.id,
                    });
                    return state;
                })(),
                (async (): Promise<DBUser | null> => {
                    const rows = await db("users").where({
                        username: req.auth.id,
                    });
                    return rows.length === 1 ? rows[0] : null;
                })(),
                (async (): Promise<DBUserDetail | null> => {
                    const hash = utils.computeHash(req.auth.id);
                    const rows = await db("user_details").where({ hash });
                    return rows.length === 1 ? rows[0] : null;
                })(),
            ]);
        const today = new Date();
        const title = "Mon compte";

        const hasPublicServiceEmail =
            dbUser?.primary_email &&
            !dbUser.primary_email.includes(config.domain);
        const gender = dbUserDetail?.gender || "NSP";
        let availableEmailPros: string[] = [];
        if (config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id)) {
            availableEmailPros = await betagouv.getAvailableProEmailInfos();
        }
        return onSuccess({
            title,
            currentUserId: req.auth.id,
            emailInfos: currentUser.emailInfos,
            userInfos: currentUser.userInfos,
            domain: config.domain,
            isExpired: currentUser.isExpired,
            isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
            // can create email if email is not set, or if email is not @beta.gouv.fr email
            canCreateEmail: currentUser.canCreateEmail,
            hasPublicServiceEmail,
            canCreateProAccount: config.ESPACE_MEMBRE_ADMIN.includes(
                req.auth.id
            ),
            availableEmailPros,
            canCreateRedirection: currentUser.canCreateRedirection,
            canChangePassword: currentUser.canChangePassword,
            communication_email: dbUser?.communication_email,
            emailSuspended:
                dbUser?.primary_email_status ===
                EmailStatusCode.EMAIL_SUSPENDED,
            status: dbUser?.primary_email_status,
            canChangeEmails: currentUser.canChangeEmails,
            redirections: currentUser.redirections,
            secondaryEmail: dbUser?.secondary_email,
            primaryEmail: dbUser?.primary_email,
            activeTab: "account",
            subActiveTab: "account",
            marrainageState,
            tjm: dbUserDetail?.tjm
                ? `${dbUserDetail.tjm} euros`
                : "Non renseigné",
            average_nb_of_days: dbUserDetail?.average_nb_of_days,
            gender: genderOptions.find(
                (opt) => opt.key.toLowerCase() === gender.toLowerCase()
            )?.name,
            legal_status: dbUser?.legal_status
                ? statusOptions.find((opt) => opt.key === dbUser.legal_status)
                      ?.name
                : "Non renseigné",
            workplace: dbUser?.workplace_insee_code
                ? await fetchCommuneDetails(dbUser.workplace_insee_code).then(
                      (commune) => commune?.nom
                  )
                : "Non renseigné",
            formData: {},
            hasActiveResponder:
                currentUser.responder &&
                new Date(currentUser.responder.to) >= today &&
                new Date(currentUser.responder.from) <= today,
            hasResponder: Boolean(currentUser.responder),
            responderFormData: currentUser.responder
                ? {
                      from: new Date(currentUser.responder.from)
                          .toISOString()
                          .split("T")[0],
                      to: new Date(currentUser.responder.to)
                          .toISOString()
                          .split("T")[0],
                      content: currentUser.responder.content,
                  }
                : {
                      from: new Date().toISOString().split("T")[0],
                      to: "",
                      content: "",
                  },
            errors: req.flash("error"),
            messages: req.flash("message"),
        });
    } catch (err) {
        onError(err);
    }
};

export async function getCurrentAccountApi(req, res) {
    getAccount(
        req,
        res,
        (data) => {
            return res.json(data);
        },
        (err) => {
            console.error(err);
            return res.status(500).json({
                error: "Impossible de récupérer vos informations.",
            });
        }
    );
}

export async function getCurrentAccount(req, res) {
    getAccount(
        req,
        res,
        (data) => {
            return res.render("account", data);
        },
        (err) => {
            console.error(err);
            req.flash("error", "Impossible de récupérer vos informations.");
            return res.redirect("/");
        }
    );
}

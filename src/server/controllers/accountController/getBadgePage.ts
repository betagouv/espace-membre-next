import config from "@/server/config";
import * as utils from "@controllers/utils";
import DS from "@/server/config/ds/ds.config";
import { BadgeDossier } from "@/models/badgeDemande";
import { BADGE_REQUEST } from "@/models/badgeRequests";
import { getBadgeRequestWithStatus } from "@db/dbBadgeRequests";
import db from "@db";

export async function getBadgePageApi(req, res) {
    getBadge(
        req,
        res,
        (data) => {
            res.json({
                ...data,
            });
        },
        () => {
            return res.status(500).json({
                error: req.flash("error"),
            });
        }
    );
}

export async function getBadge(req, res, onSuccess, onError) {
    try {
        const [currentUser, dbUser] = await Promise.all([
            (async () => utils.userInfos(req.auth.id, true))(),
            db("users").where({ username: req.auth.id }).first(),
        ]);
        // const dossiers = await DS.getAllDossiersForDemarche(config.DS_DEMARCHE_NUMBER)
        let badgeRequest = await getBadgeRequestWithStatus(
            req.auth.id,
            BADGE_REQUEST.BADGE_REQUEST_PENDING
        );
        let dossier;
        if (badgeRequest) {
            try {
                dossier = (await DS.getDossierForDemarche(
                    badgeRequest.dossier_number
                )) as unknown as BadgeDossier;
            } catch (e) {
                // dossier is no filled yet
            }
        }
        const title = "Demande de badge";
        onSuccess({
            title,
            dossier,
            currentUserId: req.auth.id,
            primaryEmail: dbUser.primary_email,
            firstName: currentUser.userInfos?.fullname.split(" ")[0],
            lastName: currentUser.userInfos?.fullname
                .split(" ")[1]
                .toUpperCase(),
            attributaire: currentUser.userInfos?.employer.split("/")[1],
            endDate: currentUser.userInfos?.end,
            domain: config.domain,
            isExpired: currentUser.isExpired,
            badgeRequest,
            subActiveTab: "badge",
            activeTab: "account",
            isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
        });
    } catch (err) {
        console.error(err);
        req.flash("error", "Impossible de récupérer vos informations.");
        onError();
    }
}

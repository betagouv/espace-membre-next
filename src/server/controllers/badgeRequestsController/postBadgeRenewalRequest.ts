import { capitalizeWords, userInfos } from "../utils";
import { db } from "@/lib/kysely";
import { BADGE_REQUEST } from "@/models/badgeRequests";
import config from "@/server/config";
import DS from "@/server/config/ds/ds.config";
import {
    createBadgeRequest,
    getBadgeRequestWithStatus,
} from "@db/dbBadgeRequests";

const buildRequestId = () => {
    return "";
};

const computeStartDate = () => {
    const date = new Date();
    const minimalDelay = 14; // badge can be issue min 2 weeks after demande
    date.setDate(date.getDate() + minimalDelay);
    date.toISOString().split("T")[0];
    return date;
};

export async function postBadgeRenewalRequest(req, res) {
    const currentUser = await userInfos(req.auth.id, true);
    const startDate = computeStartDate();
    let endDate: Date;
    let isRequestPendingToBeFilled = false;
    let badgeRequest = await getBadgeRequestWithStatus(
        req.auth.id,
        BADGE_REQUEST.BADGE_RENEWAL_REQUEST_PENDING
    );
    if (!!badgeRequest) {
        const dossier = await DS.getDossierForDemarche(
            badgeRequest.dossier_number
        );
        if (!dossier) {
            isRequestPendingToBeFilled = true;
        }
    }
    if (!isRequestPendingToBeFilled) {
        // todo
        // if (!currentUser.userInfos?.end) {
        //     endDate = startDate;
        //     endDate.setMonth(endDate.getMonth() + 6);
        // } else {
        //     endDate = new Date(currentUser.userInfos?.end);
        // }
        endDate = new Date();
        try {
            const names = req.auth.id.split(".");
            const firstname = capitalizeWords(names.shift());
            const lastname = names
                .map((name) => capitalizeWords(name))
                .join(" ");
            let dossier = (await DS.createPrefillDossier(
                config.DS_DEMARCHE_RENEWAL_BADGE_NUMBER,
                {
                    identite_prenom: firstname,
                    identite_nom: lastname,
                    champ_Q2hhbXAtMzcwOTI5Mw: "", //endDate,
                }
            )) as unknown as {
                dossier_number: number;
                dossier_url: string;
                dossier_prefill_token: string;
            };
            if (dossier && typeof dossier.dossier_number) {
                let dossier_number = dossier.dossier_number;
                badgeRequest = await db
                    .insertInto("badge_requests")
                    .values({
                        username: req.auth.id,
                        status: BADGE_REQUEST.BADGE_RENEWAL_REQUEST_PENDING,
                        start_date: startDate,
                        end_date: endDate,
                        dossier_number,
                        request_id: buildRequestId(),
                        ds_token: dossier.dossier_prefill_token,
                    })
                    .returningAll()
                    .executeTakeFirst();
            }
        } catch (e) {
            console.error(e);
        }
    }
    return res.status(200).json({
        request_id: badgeRequest?.request_id,
        dossier_token: badgeRequest?.ds_token,
        dossier_number: badgeRequest?.dossier_number,
    });
}

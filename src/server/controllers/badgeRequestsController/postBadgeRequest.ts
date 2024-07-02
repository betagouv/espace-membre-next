import { capitalizeWords, userInfos } from "../utils";
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

export async function postBadgeRequest(req, res) {
    const currentUser = await userInfos({ username: req.auth.id }, true);
    const startDate = computeStartDate();
    let endDate: Date;

    let badgeRequest = await getBadgeRequestWithStatus(
        req.auth.id,
        BADGE_REQUEST.BADGE_REQUEST_PENDING
    );
    let isRequestPendingToBeFilled = false;
    if (badgeRequest) {
        const dossier = await DS.getDossierForDemarche(
            badgeRequest.dossier_number
        );
        if (!dossier) {
            isRequestPendingToBeFilled = true;
        }
    }
    if (!isRequestPendingToBeFilled) {
        try {
            // todo
            // if (!currentUser.userInfos?.end) {
            //     endDate = startDate;
            //     endDate.setMonth(endDate.getMonth() + 6);
            // } else {
            //     endDate = new Date(currentUser.userInfos?.end);
            // }
            endDate = new Date();
            const names = req.auth.id.split(".");
            const firstname = capitalizeWords(names.shift());
            const lastname = names
                .map((name) => capitalizeWords(name))
                .join(" ");
            let dossier = (await DS.createPrefillDossier(
                config.DS_DEMARCHE_NUMBER,
                {
                    champ_Q2hhbXAtNjYxNzM5: firstname,
                    champ_Q2hhbXAtNjYxNzM3: lastname,
                    identite_prenom: firstname,
                    identite_nom: lastname,
                    champ_Q2hhbXAtNjYxNzM4: "", // todo
                    champ_Q2hhbXAtNjcxODAy: "", // todo endDate,
                    champ_Q2hhbXAtMzE0MzkxNA: [
                        "Locaux SEGUR 5.413, 5.416, 5.420, 5.425, 5.424, 5.428 et cantine",
                    ],
                    // "champ_Q2hhbXAtMzE0MzkxNA":["Locaux SEGUR 5.413, 5.416, 5.420, 5.425, 5.424, 5.428 et cantine","Parking"],
                    // "champ_Q2hhbXAtMzE4MjQ0Ng":"Texte court",
                    // "champ_Q2hhbXAtMzE4MjQ0Nw":"true",
                    // "champ_Q2hhbXAtMzE4MjQ0Mw":"Locaux SEGUR 5.413, 5.416, 5.420, 5.425, 5.424, 5.428 et cantine"
                }
            )) as unknown as {
                dossier_number: number;
                dossier_url: string;
                dossier_prefill_token: string;
            };
            if (dossier && typeof dossier.dossier_number) {
                let dossier_number = dossier.dossier_number;
                badgeRequest = await createBadgeRequest({
                    username: req.auth.id,
                    status: BADGE_REQUEST.BADGE_REQUEST_PENDING,
                    start_date: startDate,
                    end_date: new Date(endDate),
                    dossier_number,
                    request_id: buildRequestId(),
                    ds_token: dossier.dossier_prefill_token,
                });
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

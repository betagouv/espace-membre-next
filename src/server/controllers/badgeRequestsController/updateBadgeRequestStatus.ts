import { BADGE_REQUEST } from "@/models/badgeRequests";
import { updateBadgeRequest } from "@db/dbBadgeRequests";

export async function updateBadgeRequestStatus(req, res) {
    await updateBadgeRequest(
        {
            status: BADGE_REQUEST.BADGE_REQUEST_SENT,
        },
        req.auth.id
    );

    return res.json({});
}

export async function updateBadgeRenewalRequestStatus(req, res) {
    await updateBadgeRequest(
        {
            status: BADGE_REQUEST.BADGE_RENEWAL_REQUEST_SENT,
        },
        req.auth.id
    );

    return res.json({});
}

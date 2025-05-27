import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { Badge } from "@/components/BadgePage/BadgePage";
import { db } from "@/lib/kysely";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { badgeDossierSchema } from "@/models/badgeDemande";
import { BADGE_REQUEST, badgeRequestSchema } from "@/models/badgeRequests";
import { badgeRequestToModel, userInfosToModel } from "@/models/mapper";
import DS from "@/server/config/ds/ds.config";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.accountBadge()} / Espace Membre`,
};

export default async function Page() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        redirect("/login");
    }
    const userInfos = userInfosToModel(
        await getUserInfos({ uuid: session.user.uuid }),
    );
    // const dossiers = await DS.getAllDossiersForDemarche(config.DS_DEMARCHE_NUMBER)
    let dbBadgeRequest = await db
        .selectFrom("badge_requests")
        .selectAll()
        .where(
            "badge_requests.status",
            "=",
            BADGE_REQUEST.BADGE_RENEWAL_REQUEST_PENDING,
        )
        .where("badge_requests.username", "=", session.user.id)
        .executeTakeFirst();
    let badgeRequest = dbBadgeRequest
        ? badgeRequestSchema.parse(badgeRequestToModel(dbBadgeRequest))
        : undefined;
    let dossier;
    if (badgeRequest) {
        try {
            dossier = badgeDossierSchema.parse(
                await DS.getDossierForDemarche(badgeRequest.dossier_number),
            );
        } catch (e) {
            // dossier is no filled yet
        }
    }

    return <Badge dossier={dossier} badgeRequest={badgeRequest}></Badge>;
}

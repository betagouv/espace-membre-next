import { isAfter, isBefore } from "date-fns";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import MatomoServiceForm from "@/components/Service/MatomoServiceForm";
import { db } from "@/lib/kysely";
import { getServiceAccount } from "@/lib/kysely/queries/services";
import { getUserStartups } from "@/lib/kysely/queries/users";
import {
    matomoServiceInfoToModel,
    matomoSiteToModel,
} from "@/models/mapper/matomoMapper";
import { userStartupToModel } from "@/models/mapper/startupMapper";
import { SERVICES } from "@/models/services";
import { authOptions } from "@/utils/authoptions";

export default async function MatomoPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }
    const rawAccount = await getServiceAccount(
        session.user.uuid,
        SERVICES.MATOMO
    );
    const service_account = rawAccount
        ? matomoServiceInfoToModel(rawAccount)
        : undefined;

    const now = new Date();
    const startups = (await getUserStartups(session.user.uuid))
        .filter((startup) => {
            return (
                isAfter(now, startup.start ?? 0) &&
                isBefore(now, startup.end ?? Infinity)
            );
        })
        .map((startup) => userStartupToModel(startup));

    const matomoSites = !startups.length
        ? []
        : await db
              .selectFrom("matomo_sites")
              .selectAll()
              .where(
                  "startup_id",
                  "in",
                  startups.map((s) => s.uuid)
              )
              .execute()
              .then((data) => data.map((d) => matomoSiteToModel(d)));

    return (
        <>
            {!!service_account && <h1>Ajouter un accès a un site matomo</h1>}
            {!service_account && <h1>Créer mon compte matomo</h1>}
            <MatomoServiceForm
                userEmail={session.user.email}
                createAccount={!!service_account}
                sites={matomoSites}
            />
        </>
    );
}

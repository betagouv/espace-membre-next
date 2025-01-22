import { isAfter, isBefore } from "date-fns";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import SentryServiceForm from "@/components/Service/SentryServiceForm";
import { db } from "@/lib/kysely";
import { getServiceAccount } from "@/lib/kysely/queries/services";
import { getUserStartups } from "@/lib/kysely/queries/users";
import {
    sentryServiceInfoToModel,
    sentryTeamToModel,
} from "@/models/mapper/sentryMapper";
import { userStartupToModel } from "@/models/mapper/startupMapper";
import { SERVICES } from "@/models/services";
import { authOptions } from "@/utils/authoptions";

export default async function SentryPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }
    const rawAccount = await getServiceAccount(
        session.user.uuid,
        SERVICES.SENTRY
    );
    const service_account = rawAccount
        ? sentryServiceInfoToModel(rawAccount)
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

    const sentryTeams = !startups.length
        ? []
        : await db
              .selectFrom("sentry_teams")
              .selectAll()
              .where(
                  "startup_id",
                  "in",
                  startups.map((s) => s.uuid)
              )
              .execute()
              .then((data) => data.map((d) => sentryTeamToModel(d)));

    return (
        <>
            {!!service_account && <h1>Ajouter un accès a un site sentry</h1>}
            {!service_account && <h1>Créer mon compte sentry</h1>}
            <SentryServiceForm teams={sentryTeams} />
        </>
    );
}

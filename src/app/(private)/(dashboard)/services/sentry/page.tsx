import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import AccountDetails from "@/components/Service/AccountDetails";
import SentryServiceForm from "@/components/Service/SentryServiceForm";
import { db } from "@/lib/kysely";
import { getServiceAccount } from "@/lib/kysely/queries/services";
import { sentryServiceInfoToModel } from "@/models/mapper/sentryMapper";
import { sentryUserSchemaType } from "@/models/sentry";
import { SERVICES } from "@/models/services";
import config from "@/server/config";
import { authOptions } from "@/utils/authoptions";

const buildLinkToSentryTeam = (
    team: sentryUserSchemaType["metadata"]["teams"][0]
) => {
    return team.name ? (
        <a href={`${config.SENTRY_WEBSITE_URL}/${team.slug}`} target="_blank">
            {team.name}
        </a>
    ) : (
        team.name
    );
};

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

    const sentryTeams = await db
        .selectFrom("sentry_teams")
        .selectAll()
        .execute();

    return (
        <>
            <h1>Compte Sentry</h1>

            {service_account ? (
                <>
                    <AccountDetails
                        account={service_account}
                        data={service_account.metadata.teams.map((team) => [
                            buildLinkToSentryTeam(team),
                            team.role,
                        ])}
                        headers={["nom", "niveau d'accès"]}
                    />
                </>
            ) : (
                <SentryServiceForm teams={sentryTeams} />
            )}
        </>
    );
}

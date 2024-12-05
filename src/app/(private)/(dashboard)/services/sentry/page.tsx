import Table from "@codegouvfr/react-dsfr/Table";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import AccountDetails from "@/components/Service/AccountDetails";
import SentryServiceForm from "@/components/Service/SentryServiceForm";
import { db } from "@/lib/kysely";
import { getServiceAccount } from "@/lib/kysely/queries/services";
import { EventCodeToReadable } from "@/models/actionEvent";
import { sentryServiceInfoToModel } from "@/models/mapper/sentryMapper";
import { sentryUserSchemaType } from "@/models/sentry";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
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

    const sentryEvents = await db
        .selectFrom("events")
        .where("action_on_username", "=", session.user.id)
        .where("action_code", "like", `%MEMBER_SERVICE%`)
        .where("action_metadata", "like", `%sentry%`)
        .selectAll()
        .orderBy("created_at desc")
        .execute();

    const formatMetadata = (metadata) => {
        if ("teams" in metadata) {
            return `Ajout ${
                metadata.teams.length ? "aux" : "à l'"
            } équipe ${metadata.teams.join(",")}`;
        } else {
            return JSON.stringify(metadata);
        }
    };

    return (
        <>
            <h1>Compte Sentry</h1>

            {!!service_account && (
                <>
                    <AccountDetails
                        account={service_account}
                        data={
                            service_account.metadata
                                ? service_account.metadata.teams.map((team) => [
                                      buildLinkToSentryTeam(team),
                                      team.role,
                                  ])
                                : []
                        }
                        headers={["nom", "niveau d'accès"]}
                    />
                </>
            )}

            <h2 className="fr-mt-8v">Demander des accès</h2>
            <SentryServiceForm teams={sentryTeams} />

            <h2 className="fr-mt-8v">Historique des événements</h2>
            {!!sentryEvents.length && (
                <Table
                    headers={["Code", "Metadata", "Date"]}
                    data={sentryEvents.map((e) => [
                        EventCodeToReadable[e.action_code],
                        formatMetadata(e.action_metadata),
                        e.created_at.toDateString(),
                    ])}
                ></Table>
            )}
        </>
    );
}

import Table from "@codegouvfr/react-dsfr/Table";
import { isAfter } from "date-fns/isAfter";
import { isBefore } from "date-fns/isBefore";
import { Selectable } from "kysely/dist/cjs";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import AccountDetails from "@/components/Service/AccountDetails";
import SentryServiceForm from "@/components/Service/SentryServiceForm";
import * as hstore from "@/lib/hstore";
import { db, sql } from "@/lib/kysely";
import { getServiceAccount } from "@/lib/kysely/queries/services";
import { getUserStartups } from "@/lib/kysely/queries/users";
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

    const now = new Date();
    const startups = (await getUserStartups(session.user.uuid)).filter(
        (startup) => {
            return (
                isAfter(now, startup.start ?? 0) &&
                isBefore(now, startup.end ?? Infinity)
            );
        }
    );

    let sentryTeams: { name: string }[] = [];

    if (session.user.isAdmin) {
        sentryTeams = await db.selectFrom("sentry_teams").selectAll().execute();
    } else if (startups.length) {
        sentryTeams = await db
            .selectFrom("sentry_teams")
            .selectAll()
            .where(
                "startup_id",
                "in",
                startups.map((s) => s.uuid)
            )
            .execute();
    }

    const sentryEvents = await db
        .selectFrom("events")
        .where("action_on_username", "=", session.user.id)
        .where("action_code", "like", `%MEMBER_SERVICE%`)
        .where(sql`action_metadata -> 'service'`, "=", `sentry`)
        .selectAll()
        .orderBy("created_at desc")
        .execute();

    const formatMetadata = (metadata) => {
        if (metadata) {
            const data = hstore.parse(metadata);
            console.log(data);
            if ("teams" in data) {
                return (
                    <>
                        <p>
                            Ajout {data.teams.length > 1 ? "aux" : "à l'"}{" "}
                            équipe{data.teams.length > 1 ? "s" : ""} :
                        </p>
                        <ul>
                            {data.teams.map((t, index) => (
                                <li key={index}>
                                    {t.teamSlug} avec le role {t.teamRole}
                                </li>
                            ))}
                        </ul>
                    </>
                );
            } else {
                return JSON.stringify(data);
            }
        }
        return;
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
                        nbEvents={sentryEvents.length}
                        headers={["nom", "niveau d'accès"]}
                    />
                </>
            )}

            <h2 className="fr-mt-8v">Demander des accès</h2>
            <SentryServiceForm teams={sentryTeams} />

            <h2 className="fr-mt-8v">Historique des événements</h2>
            {!sentryEvents.length && <p>Pas d'événements pour l'instant</p>}
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

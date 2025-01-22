// import Table from "@codegouvfr/react-dsfr/Table";
// import { isAfter } from "date-fns/isAfter";
// import { isBefore } from "date-fns/isBefore";
// import { Selectable } from "kysely/dist/cjs";
// import { redirect } from "next/navigation";
// import { getServerSession } from "next-auth/next";

// import AccountDetails from "@/components/Service/AccountDetails";
// import SentryServiceForm from "@/components/Service/SentryServiceForm";
// import * as hstore from "@/lib/hstore";
// import { db, sql } from "@/lib/kysely";
// import { getServiceAccount } from "@/lib/kysely/queries/services";
// import { getUserStartups } from "@/lib/kysely/queries/users";
// import { EventCodeToReadable } from "@/models/actionEvent";
// import { sentryServiceInfoToModel } from "@/models/mapper/sentryMapper";
// import { sentryUserSchemaType } from "@/models/sentry";
// import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
// import config from "@/server/config";
// import { authOptions } from "@/utils/authoptions";

// export default async function SentryPage() {
//     const session = await getServerSession(authOptions);
//     if (!session) {
//         redirect("/login");
//     }

//     const rawAccount = await getServiceAccount(
//         session.user.uuid,
//         SERVICES.SENTRY
//     );
//     const service_account = rawAccount
//         ? sentryServiceInfoToModel(rawAccount)
//         : undefined;

//     const now = new Date();
//     const startups = (await getUserStartups(session.user.uuid)).filter(
//         (startup) => {
//             return (
//                 isAfter(now, startup.start ?? 0) &&
//                 isBefore(now, startup.end ?? Infinity)
//             );
//         }
//     );

//     let sentryTeams: { name: string }[] = [];

//     if (session.user.isAdmin) {
//         sentryTeams = await db.selectFrom("sentry_teams").selectAll().execute();
//     } else if (startups.length) {
//         sentryTeams = await db
//             .selectFrom("sentry_teams")
//             .selectAll()
//             .where(
//                 "startup_id",
//                 "in",
//                 startups.map((s) => s.uuid)
//             )
//             .execute();
//     }

//     const sentryEvents = await db
//         .selectFrom("events")
//         .where("action_on_username", "=", session.user.id)
//         .where("action_code", "like", `%MEMBER_SERVICE%`)
//         .where(sql`action_metadata -> 'service'`, "=", `sentry`)
//         .selectAll()
//         .orderBy("created_at desc")
//         .execute();

//     const formatMetadata = (metadata) => {
//         if (metadata) {
//             const data = hstore.parse(metadata);
//             console.log(data);
//             if ("teams" in data) {
//                 return (
//                     <>
//                         <p>
//                             Ajout {data.teams.length > 1 ? "aux" : "à l'"}{" "}
//                             équipe{data.teams.length > 1 ? "s" : ""} :
//                         </p>
//                         <ul>
//                             {data.teams.map((t, index) => (
//                                 <li key={index}>
//                                     {t.teamSlug} avec le role {t.teamRole}
//                                 </li>
//                             ))}
//                         </ul>
//                     </>
//                 );
//             } else {
//                 return JSON.stringify(data);
//             }
//         }
//         return;
//     };

//     return (
//         <>
//             <h1>Compte Sentry</h1>

//             {!!service_account && (
//                 <>
//                     <AccountDetails
//                         account={service_account}
//                         data={
//                             service_account.metadata
//                                 ? service_account.metadata.teams.map((team) => [
//                                       buildLinkToSentryTeam(team),
//                                       team.role,
//                                   ])
//                                 : []
//                         }
//                         nbEvents={sentryEvents.length}
//                         headers={["nom", "niveau d'accès"]}
//                     />
//                 </>
//             )}

//             <h2 className="fr-mt-8v">Demander des accès</h2>
//             <SentryServiceForm teams={sentryTeams} />

//             <h2 className="fr-mt-8v">Historique des événements</h2>
//             {!sentryEvents.length && <p>Pas d'événements pour l'instant</p>}
//             {!!sentryEvents.length && (
//                 <Table
//                     headers={["Code", "Metadata", "Date"]}
//                     data={sentryEvents.map((e) => [
//                         EventCodeToReadable[e.action_code],
//                         formatMetadata(e.action_metadata),
//                         e.created_at.toDateString(),
//                     ])}
//                 ></Table>
//             )}
//         </>
//     );
// }

import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import { isAfter, isBefore } from "date-fns";
import { Selectable } from "kysely/dist/cjs";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { Events } from "@/@types/db";
import AccountDetails from "@/components/Service/AccountDetails";
import SentryServiceForm from "@/components/Service/SentryServiceForm";
import * as hstore from "@/lib/hstore";
import { db, sql } from "@/lib/kysely";
import { getServiceAccount } from "@/lib/kysely/queries/services";
import { getUserStartups } from "@/lib/kysely/queries/users";
import { SentryTeam } from "@/lib/sentry";
import {
    EventCode,
    EventCodeToReadable,
} from "@/models/actionEvent/actionEvent";
import {
    EventSentryAccountPayloadSchema,
    EventSentryAccountPayloadSchemaType,
} from "@/models/actionEvent/serviceActionEvent";
import { startupToModel } from "@/models/mapper";
import {
    sentryServiceInfoToModel,
    sentryTeamToModel,
} from "@/models/mapper/sentryMapper";
import { userStartupToModel } from "@/models/mapper/startupMapper";
import { sentryUserSchemaType } from "@/models/sentry";
import { sentryTeamSchemaType } from "@/models/sentryTeam";
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
    const startups = (await getUserStartups(session.user.uuid))
        .filter((startup) => {
            return (
                isAfter(now, startup.start ?? 0) &&
                isBefore(now, startup.end ?? Infinity)
            );
        })
        .map((startup) => userStartupToModel(startup));

    let sentryTeams: sentryTeamSchemaType[] = [];

    if (session.user.isAdmin) {
        sentryTeams = await db
            .selectFrom("sentry_teams")
            .selectAll()
            .execute()
            .then((data) => data.map((d) => sentryTeamToModel(d)));
    } else if (startups.length) {
        sentryTeams = await db
            .selectFrom("sentry_teams")
            .selectAll()
            .where(
                "startup_id",
                "in",
                startups.map((s) => s.uuid)
            )
            .execute()
            .then((data) => data.map((d) => sentryTeamToModel(d)));
    }

    const dbSentryEvents = await db
        .selectFrom("events")
        .where("action_on_username", "=", session.user.id)
        .where("action_code", "like", `%MEMBER_SERVICE%`)
        .where(sql`action_metadata -> 'service'`, "=", `sentry`)
        .selectAll()
        .orderBy("created_at desc")
        .execute();

    const eventDictionnary: Record<
        string,
        EventSentryAccountPayloadSchemaType[]
    > = {};
    for (const event of dbSentryEvents) {
        if (event.action_metadata) {
            const action_metadata = hstore.parse(event.action_metadata);
            const eventObj = {
                action_code: event.action_code,
                action_metadata: action_metadata,
            };
            const { data, success, error } =
                EventSentryAccountPayloadSchema.safeParse(eventObj);
            if (success) {
                if (data.action_metadata.requestId) {
                    eventDictionnary[data.action_metadata.requestId] =
                        eventDictionnary[data.action_metadata.requestId] || [];
                    eventDictionnary[data.action_metadata.requestId].push(data);
                }
            }
        }
    }

    const SENTRY_EVENTS_TO_STATUS: Record<
        | EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED
        | EventCode.MEMBER_SERVICE_ACCOUNT_CREATED
        | EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED
        | EventCode.MEMBER_SERVICE_ACCOUNT_UPDATED,
        string
    > = {
        [EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED]: "en cours",
        [EventCode.MEMBER_SERVICE_ACCOUNT_CREATED]: "compte créé",
        [EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED]: "en cours",
        [EventCode.MEMBER_SERVICE_ACCOUNT_UPDATED]: "site ajouté",
    };

    const formatMetadata = (
        data: EventSentryAccountPayloadSchemaType["action_metadata"]
    ) => {
        if ("teams" in data && data["teams"] && data["teams"].length) {
            const siteObj = data["teams"].map((site) =>
                sentryTeams.find(
                    (sentrySite) => site.teamSlug === sentrySite.id
                )
            );
            return (
                <>
                    Ajout {data.teams.length > 1 ? "des" : "du"} site
                    {data.teams.length > 1 ? "s" : ""}{" "}
                    {siteObj.map((site) => site?.name).join(", ")}
                    {data.teams.length > 1 ? "s" : ""}
                </>
            );
        }
        if (data.service) {
            return <>Création du site {data.service}</>;
        } else {
            return JSON.stringify(data);
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
                        nbEvents={dbSentryEvents.length}
                        headers={["nom", "niveau d'accès"]}
                    />
                </>
            )}
            {!service_account && <p>Tu n'as pas encore de compte sentry.</p>}

            {!!Object.keys(eventDictionnary).length && (
                <>
                    <h2 className="fr-h5">Mes demandes : </h2>
                    <Table
                        headers={["Demande", "Status"]}
                        data={Object.keys(eventDictionnary).map((event) => [
                            <>
                                {formatMetadata(
                                    eventDictionnary[event][0].action_metadata
                                )}
                            </>,
                            <>
                                {
                                    SENTRY_EVENTS_TO_STATUS[
                                        eventDictionnary[event][0].action_code
                                    ]
                                }
                            </>,
                        ])}
                    />
                </>
            )}
            <Button
                linkProps={{
                    href: "/services/sentry/request",
                }}
                className="fr-mt-2w"
            >
                {!service_account
                    ? "Créer mon compte sentry"
                    : `Faire un nouvelle demande d'accès à un site`}
            </Button>
        </>
    );
}

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import { isAfter, isBefore } from "date-fns";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import AccountDetails from "@/components/Service/AccountDetails";
import * as hstore from "@/lib/hstore";
import { db, sql } from "@/lib/kysely";
import { getServiceAccount } from "@/lib/kysely/queries/services";
import { getUserStartupsActive } from "@/lib/kysely/queries/users";
import { EventCode } from "@/models/actionEvent/actionEvent";
import {
    EventSentryAccountPayloadSchema,
    EventSentryAccountPayloadSchemaType,
} from "@/models/actionEvent/serviceActionEvent";
import {
    sentryServiceInfoToModel,
    sentryTeamToModel,
} from "@/models/mapper/sentryMapper";
import { userStartupToModel } from "@/models/mapper/startupMapper";
import { sentryUserSchemaType } from "@/models/sentry";
import { sentryTeamSchemaType } from "@/models/sentryTeam";
import { SERVICES } from "@/models/services";
import config from "@/server/config";
import { authOptions } from "@/utils/authoptions";

const buildLinkToSentryTeam = (
    team: sentryUserSchemaType["metadata"]["teams"][0]
) => {
    return team.slug && team.name ? (
        <a
            href={`${config.SENTRY_WEBSITE_URL}/organizations/${config.SENTRY_ORGANIZATION}/projects/${team.slug}`}
            target="_blank"
        >
            {team.name}
        </a>
    ) : (
        "-"
    );
};

const getAllSentryTeams = () =>
    db
        .selectFrom("sentry_teams")
        .selectAll()
        .execute()
        .then((data) => data.map((d) => sentryTeamToModel(d)));

const getSentryTeamsForStartups = (startups) =>
    db
        .selectFrom("sentry_teams")
        .selectAll()
        .where(
            "startup_id",
            "in",
            startups.map((s) => s.uuid)
        )
        .execute()
        .then((data) => data.map((d) => sentryTeamToModel(d)));

const getUserSentryEvents = (id) =>
    db
        .selectFrom("events")
        .where("action_on_username", "=", id)
        .where("action_code", "like", `%MEMBER_SERVICE%`)
        .where(sql`action_metadata -> 'service'`, "=", `sentry`)
        .selectAll()
        .orderBy("created_at desc")
        .execute();

export default async function SentryRequestPage() {
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
    const startups = (await getUserStartupsActive(session.user.uuid)).map(
        (startup) => userStartupToModel(startup)
    );

    let sentryTeams: sentryTeamSchemaType[] = [];
    if (session.user.isAdmin) {
        sentryTeams = await getAllSentryTeams();
    } else if (startups.length) {
        sentryTeams = await getSentryTeamsForStartups(startups);
    }

    const dbSentryEvents = await getUserSentryEvents(session.user.id);

    const eventDictionnary: Record<
        string,
        EventSentryAccountPayloadSchemaType[]
    > = {};
    for (const event of dbSentryEvents.filter(
        (event) => event.action_metadata
    )) {
        const action_metadata = hstore.parse(event.action_metadata);
        const eventObj = {
            action_code: event.action_code,
            action_metadata: action_metadata,
        };
        const { data, success } =
            EventSentryAccountPayloadSchema.safeParse(eventObj);
        if (success && data.action_metadata.requestId) {
            eventDictionnary[data.action_metadata.requestId] =
                eventDictionnary[data.action_metadata.requestId] || [];
            eventDictionnary[data.action_metadata.requestId].push(data);
        }
    }

    const SENTRY_EVENTS_TO_STATUS: Record<
        | EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED
        | EventCode.MEMBER_SERVICE_ACCOUNT_CREATED
        | EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED
        | EventCode.MEMBER_SERVICE_ACCOUNT_UPDATED
        | EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_FAILED_USER_DOES_NOT_EXIST,
        string
    > = {
        [EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED]: "en cours",
        [EventCode.MEMBER_SERVICE_ACCOUNT_CREATED]: "compte créé",
        [EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED]: "en cours",
        [EventCode.MEMBER_SERVICE_ACCOUNT_UPDATED]: "équipe ajoutée",
        [EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_FAILED_USER_DOES_NOT_EXIST]:
            "Mise à jour échouée. L'utilisateur n'existe pas.",
    };

    const formatMetadata = (
        data: EventSentryAccountPayloadSchemaType["action_metadata"]
    ) => {
        if ("teams" in data && data["teams"]?.length) {
            const siteObj = data["teams"].map((site) =>
                sentryTeams.find(
                    (sentrySite) => site.teamSlug === sentrySite.id
                )
            );
            return (
                <>
                    Ajout {data.teams.length > 1 ? "des" : "de l'"} équipe
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

    const pendingStatus = [
        EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED,
        EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED,
    ];
    const isLastEventPending = dbSentryEvents.length
        ? !!pendingStatus.includes(dbSentryEvents[0].action_code as EventCode)
        : false;

    const buttonLabel = !service_account
        ? "Créer mon compte sentry"
        : `Faire une nouvelle demande d'accès à une équipe`;

    const accountDetails =
        !!service_account && service_account.metadata
            ? service_account.metadata.teams.map((team) => [
                  buildLinkToSentryTeam(team),
                  team.role,
              ])
            : [];

    return (
        <>
            <h1>Compte Sentry</h1>
            <div
                className={fr.cx(
                    "fr-grid-row",
                    "fr-grid-row--gutters",
                    "fr-mb-2w"
                )}
            >
                <div
                    className={fr.cx("fr-col-12", "fr-col-md-6", "fr-col-lg-6")}
                >
                    {!!service_account && (
                        <>
                            <AccountDetails
                                account={service_account}
                                data={accountDetails}
                                nbEvents={dbSentryEvents.length}
                                headers={["nom", "niveau d'accès"]}
                            />
                        </>
                    )}
                    {!service_account && (
                        <p>Tu n'as pas encore de compte sentry.</p>
                    )}
                </div>
            </div>
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
            {!isLastEventPending && (
                <Button
                    linkProps={{
                        href: "/services/sentry/request",
                    }}
                    className="fr-mt-2w"
                >
                    {buttonLabel}
                </Button>
            )}
            {!!isLastEventPending && (
                <>
                    <div
                        className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}
                    >
                        <div
                            className={fr.cx(
                                "fr-col-12",
                                "fr-col-md-6",
                                "fr-col-lg-6"
                            )}
                        >
                            <Alert
                                severity="info"
                                small={true}
                                description={`Tu as une demande en cours, celle-ci doit être terminée avant d'en fait une autre.`}
                            />
                        </div>
                    </div>
                    <Button disabled={true} className="fr-mt-2w">
                        {buttonLabel}
                    </Button>
                </>
            )}
        </>
    );
}

import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import { isAfter, isBefore } from "date-fns";
import { Selectable } from "kysely/dist/cjs";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { Events } from "@/@types/db";
import AccountDetails from "@/components/Service/AccountDetails";
import MatomoServiceForm from "@/components/Service/MatomoServiceForm";
import * as hstore from "@/lib/hstore";
import { db, sql } from "@/lib/kysely";
import { getServiceAccount } from "@/lib/kysely/queries/services";
import { getUserStartups } from "@/lib/kysely/queries/users";
import {
    EventCode,
    EventCodeToReadable,
} from "@/models/actionEvent/actionEvent";
import {
    EventMatomoAccountPayloadSchema,
    EventMatomoAccountPayloadSchemaType,
} from "@/models/actionEvent/serviceActionEvent";
import { startupToModel } from "@/models/mapper";
import {
    matomoServiceInfoToModel,
    matomoSiteToModel,
} from "@/models/mapper/matomoMapper";
import { userStartupToModel } from "@/models/mapper/startupMapper";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { authOptions } from "@/utils/authoptions";

export default async function MatomoPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    const rawAccount = await getServiceAccount(
        session.user.uuid,
        SERVICES.MATOMO,
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

    let matomoSites: Selectable<"MatomoSite">[] = [];

    if (session.user.isAdmin) {
        matomoSites = await db
            .selectFrom("matomo_sites")
            .selectAll()
            .execute()
            .then((data) => data.map((d) => matomoSiteToModel(d)));
    } else if (startups.length) {
        matomoSites = await db
            .selectFrom("matomo_sites")
            .selectAll()
            .where(
                "startup_id",
                "in",
                startups.map((s) => s.uuid),
            )
            .execute()
            .then((data) => data.map((d) => matomoSiteToModel(d)));
    }

    const dbMatomoEvents = await db
        .selectFrom("events")
        .where("action_on_username", "=", session.user.id)
        .where("action_code", "like", `%MEMBER_SERVICE%`)
        .where(sql`action_metadata -> 'service'`, "=", `matomo`)
        .selectAll()
        .orderBy("created_at desc")
        .execute();

    const eventDictionnary: Record<
        string,
        EventMatomoAccountPayloadSchemaType[]
    > = {};
    for (const event of dbMatomoEvents) {
        if (event.action_metadata) {
            const action_metadata = hstore.parse(event.action_metadata);
            const eventObj = {
                action_code: event.action_code,
                action_metadata: action_metadata,
            };
            const { data, success, error } =
                EventMatomoAccountPayloadSchema.safeParse(eventObj);
            if (success) {
                if (data.action_metadata.requestId) {
                    eventDictionnary[data.action_metadata.requestId] =
                        eventDictionnary[data.action_metadata.requestId] || [];
                    eventDictionnary[data.action_metadata.requestId].push(data);
                }
            }
        }
    }

    const MATOMO_EVENTS_TO_STATUS: Record<
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
        data: EventMatomoAccountPayloadSchemaType["action_metadata"],
    ) => {
        if ("sites" in data && data["sites"] && data["sites"].length) {
            const siteObj = data["sites"].map((site) =>
                matomoSites.find((matomoSite) => site.id === matomoSite.id),
            );
            return (
                <>
                    Ajout {data.sites.length > 1 ? "des" : "du"} site
                    {data.sites.length > 1 ? "s" : ""}{" "}
                    {siteObj.map((site) => site?.name).join(", ")}
                    {data.sites.length > 1 ? "s" : ""}
                </>
            );
        }
        if (data.newSite) {
            return <>Création du site {data.newSite.url}</>;
        } else {
            return JSON.stringify(data);
        }
    };
    return (
        <>
            <h1>Compte Matomo</h1>
            {service_account && (
                <>
                    <h2 className="fr-h5">Mes accès : </h2>
                    <AccountDetails
                        account={service_account}
                        data={
                            service_account.metadata
                                ? service_account.metadata.sites.map((s) => [
                                      s.url ? (
                                          <a href={s.url} target="_blank">
                                              {s.name}
                                          </a>
                                      ) : (
                                          s.name
                                      ),
                                      s.type,
                                      s.accessLevel,
                                  ])
                                : []
                        }
                        nbEvents={dbMatomoEvents.length}
                        headers={["nom", "type", "niveau d'accès"]}
                    />
                </>
            )}
            {!service_account && <p>Tu n'as pas encore de compte matomo.</p>}

            {!!Object.keys(eventDictionnary).length && (
                <>
                    <h2 className="fr-h5">Mes demandes : </h2>
                    <Table
                        headers={["Demande", "Status"]}
                        data={Object.keys(eventDictionnary).map((event) => [
                            <>
                                {formatMetadata(
                                    eventDictionnary[event][0].action_metadata,
                                )}
                            </>,
                            <>
                                {
                                    MATOMO_EVENTS_TO_STATUS[
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
                    href: "/services/matomo/request",
                }}
                className="fr-mt-2w"
            >
                {!service_account
                    ? "Créer mon compte matomo"
                    : `Faire une nouvelle demande d'accès à un site`}
            </Button>
        </>
    );
}

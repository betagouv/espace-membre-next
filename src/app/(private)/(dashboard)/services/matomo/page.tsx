import Alert from "@codegouvfr/react-dsfr/Alert";
import Table from "@codegouvfr/react-dsfr/Table";
import { isAfter, isBefore } from "date-fns";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import AccountDetails from "@/components/Service/AccountDetails";
import MatomoServiceForm from "@/components/Service/MatomoServiceForm";
import * as hstore from "@/lib/hstore";
import { db, sql } from "@/lib/kysely";
import { getServiceAccount } from "@/lib/kysely/queries/services";
import { getUserStartups } from "@/lib/kysely/queries/users";
import { EventCodeToReadable } from "@/models/actionEvent/actionEvent";
import {
    matomoServiceInfoToModel,
    matomoSiteToModel,
} from "@/models/mapper/matomoMapper";
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
    const startups = (await getUserStartups(session.user.uuid)).filter(
        (startup) => {
            return (
                isAfter(now, startup.start ?? 0) &&
                isBefore(now, startup.end ?? Infinity)
            );
        }
    );

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

    const matomoEvents = await db
        .selectFrom("events")
        .where("action_on_username", "=", session.user.id)
        .where("action_code", "like", `%MEMBER_SERVICE%`)
        .where(sql`action_metadata -> 'service'`, "=", `matomo`)
        .selectAll()
        .orderBy("created_at desc")
        .execute();

    const formatMetadata = (metadata) => {
        if (metadata) {
            const data = hstore.parse(metadata);
            if ("sites" in data) {
                return (
                    <>
                        <p>
                            Ajout {data.sites.length > 1 ? "aux" : "à l'"}{" "}
                            équipe{data.sites.length > 1 ? "s" : ""} :
                        </p>
                        <ul>
                            {data.sites.map((t, index) => (
                                <li key={index}>
                                    {t.siteSlug} avec le rôle {t.siteRole}
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
            <h1>Compte Matomo</h1>
            {service_account && (
                <>
                    <Alert
                        small={true}
                        className={"fr-mb-8v"}
                        description={
                            <p>
                                Ton compte matomo existe. Tu peux définir ton
                                mot de passe en faisant une réinitialisation de
                                mot de passe sur{" "}
                                <a href="https://stats.beta.gouv.fr">
                                    stats.beta.gouv.fr
                                </a>
                            </p>
                        }
                        severity="info"
                    />
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
                        headers={["nom", "type", "niveau d'accès"]}
                    />
                </>
            )}
            <h2 className="fr-mt-8v">Demander des accès</h2>
            <MatomoServiceForm sites={matomoSites} />
            <h2 className="fr-mt-8v">Historique des événements</h2>
            {!!matomoEvents.length && (
                <Table
                    headers={["Code", "Metadata", "Date"]}
                    data={matomoEvents.map((e) => [
                        EventCodeToReadable[e.action_code],
                        formatMetadata(e.action_metadata),
                        e.created_at.toDateString(),
                    ])}
                ></Table>
            )}
        </>
    );
}

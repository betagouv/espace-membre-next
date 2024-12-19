import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
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
import { startupToModel } from "@/models/mapper";
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
    console.log(matomoSites);

    const matomoEvents = await db
        .selectFrom("events")
        .where("action_on_username", "=", session.user.id)
        .where("action_code", "like", `%MEMBER_SERVICE%`)
        .where(sql`action_metadata -> 'service'`, "=", `matomo`)
        .selectAll()
        .orderBy("created_at desc")
        .execute();

    return (
        <>
            {!!service_account && <h1>Ajouter un accès a un site matomo</h1>}
            {!service_account && <h1>Créer mon compte matomo</h1>}
            <MatomoServiceForm
                userEmail={session.user.email}
                createAccount={!!service_account}
                sites={matomoSites}
                userStartups={startups}
            />
        </>
    );
}

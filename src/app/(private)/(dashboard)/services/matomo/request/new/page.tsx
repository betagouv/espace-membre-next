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
import { startupToModel } from "@/models/mapper";
import { userStartupToModel } from "@/models/mapper/startupMapper";
import Button from "@codegouvfr/react-dsfr/Button";
import { CreateMatomoServiceForm } from "@/components/Service/CreateMatomoServiceForm";

export default async function NewMatomoPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    const rawAccount = await getServiceAccount(
        session.user.uuid,
        SERVICES.MATOMO
    );

    const now = new Date();
    const startups = (await getUserStartups(session.user.uuid))
        .filter((startup) => {
            return (
                isAfter(now, startup.start ?? 0) &&
                isBefore(now, startup.end ?? Infinity)
            );
        })
        .map((startup) => userStartupToModel(startup));

    return (
        <>
            <h1>Ajouter un accès a un site matomo</h1>
            <CreateMatomoServiceForm startups={startups} />
        </>
    );
}

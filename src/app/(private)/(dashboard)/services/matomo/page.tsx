import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import AccountDetails from "@/components/Service/AccountDetails";
import MatomoServiceForm from "@/components/Service/MatomoServiceForm";
import { getServiceAccount } from "@/lib/kysely/queries/services";
import { matomoServiceInfoToModel } from "@/models/mapper/matomoMapper";
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

    return (
        <>
            <h1>Compte Matomo</h1>
            {service_account ? (
                <AccountDetails
                    account={service_account}
                    data={service_account.metadata.sites.map((s) => [
                        s.url ? (
                            <a href={s.url} target="_blank">
                                {s.name}
                            </a>
                        ) : (
                            s.name
                        ),
                        s.type,
                        s.accessLevel,
                    ])}
                    headers={["nom", "type", "niveau d'accès"]}
                />
            ) : (
                <MatomoServiceForm />
            )}
        </>
    );
}

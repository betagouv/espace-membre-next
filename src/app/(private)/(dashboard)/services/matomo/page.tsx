import Badge from "@codegouvfr/react-dsfr/Badge";
import { Stepper } from "@codegouvfr/react-dsfr/Stepper";
import { Table } from "@codegouvfr/react-dsfr/Table";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { match } from "ts-pattern";

import MatomoServiceForm from "@/components/Service/MatomoServiceForm";
import { db } from "@/lib/kysely";
import { matomoServiceInfoToModel } from "@/models/mapper/matomoMapper";
import { matomoUserSchemaType } from "@/models/matomo";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.communityCreateMember()} / Espace Membre`,
};

const AccountFoundOrPending = ({
    account,
}: {
    account: matomoUserSchemaType;
}) => {
    return (
        <>
            {match(account)
                .with({ status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND }, () => (
                    <>
                        <Badge noIcon severity="success">
                            Compte actif
                        </Badge>
                        <Table
                            data={account.metadata.sites.map((s) => [
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
                    </>
                ))
                .with(
                    { status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING },
                    () => (
                        <>
                            La création du compte est en cours, tu recevra un
                            email quand ce sera bon...
                        </>
                    )
                )
                .otherwise(() => {
                    return null;
                })}
        </>
    );
};

export default async function MatomoPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }
    const service_account = await db
        .selectFrom("service_accounts")
        .selectAll()
        .where("user_id", "=", session.user.uuid)
        .where("account_type", "=", SERVICES.MATOMO)
        .executeTakeFirst()
        .then((data) => {
            return data ? matomoServiceInfoToModel(data) : undefined;
        });
    return (
        <>
            <h1>Compte matomo</h1>
            {service_account ? (
                <AccountFoundOrPending account={service_account} />
            ) : (
                <MatomoServiceForm />
            )}
        </>
    );
}

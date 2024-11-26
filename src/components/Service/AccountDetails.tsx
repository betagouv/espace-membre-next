import { ReactNode } from "react";

import Badge from "@codegouvfr/react-dsfr/Badge";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { match } from "ts-pattern";

import { matomoUserSchemaType } from "@/models/matomo";
import { sentryUserSchemaType } from "@/models/sentry";
import { ACCOUNT_SERVICE_STATUS } from "@/models/services";

interface AccountDetailsProps {
    account: sentryUserSchemaType | matomoUserSchemaType;
    data: ReactNode[][];
    headers: string[];
}

const AccountDetails = ({ account, data, headers }: AccountDetailsProps) => {
    return (
        <>
            {match(account)
                .with({ status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND }, () => (
                    <>
                        <Badge noIcon severity="success">
                            Compte actif
                        </Badge>
                        <Table data={data} headers={headers} />
                    </>
                ))
                .with(
                    { status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING },
                    () => (
                        <>
                            La création du compte est en cours, tu recevras un
                            email quand ce sera bon...
                        </>
                    )
                )
                .with(
                    { status: ACCOUNT_SERVICE_STATUS.ACCOUNT_INVITATION_SENT },
                    () => <>Une invitation t'as été envoyé par email.</>
                )
                .otherwise(() => {
                    return null;
                })}
        </>
    );
};

export default AccountDetails;

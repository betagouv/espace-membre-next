import { ReactNode } from "react";

import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { match, P } from "ts-pattern";

import { ActionEvent } from "@/models/actionEvent";
import { matomoUserSchemaType } from "@/models/matomo";
import { sentryUserSchemaType } from "@/models/sentry";
import { ACCOUNT_SERVICE_STATUS } from "@/models/services";

interface AccountDetailsProps {
    account: sentryUserSchemaType | matomoUserSchemaType;
    data: ReactNode[][];
    headers: string[];
    nbEvents: number;
}

const AccountDetails = ({
    account,
    data,
    headers,
    nbEvents,
}: AccountDetailsProps) => {
    return (
        <>
            {match(account)
                .with(
                    P.union(
                        { status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND },
                        {
                            status: ACCOUNT_SERVICE_STATUS.ACCOUNT_INVITATION_PENDING,
                        },
                    ),
                    () => (
                        <>
                            <>
                                <b>Statut</b> :{" "}
                                {account.status ===
                                    ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND && (
                                    <Badge noIcon severity="success">
                                        Compte actif
                                    </Badge>
                                )}
                                {account.status ===
                                    ACCOUNT_SERVICE_STATUS.ACCOUNT_INVITATION_PENDING && (
                                    <Badge noIcon severity="info">
                                        Invitation en attente d'acceptation
                                    </Badge>
                                )}
                                <br />
                            </>
                            <>
                                <b>Identifiant du compte sur le service</b> :{" "}
                                {account.service_user_id}
                                <br />
                            </>
                            <>
                                <b>Email de connexion</b> : {account.email}
                                <br />
                            </>

                            {data && !!data.length && (
                                <Table data={data} headers={headers} />
                            )}
                            {(!data || !data.length) && !nbEvents && (
                                <p className="fr-mt-4w">
                                    Ton compte existe mais tu n'as encore accès
                                    à aucun site ou équipe, tu peux en faire la
                                    demande ci-dessous
                                </p>
                            )}
                        </>
                    ),
                )
                .with(
                    { status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING },
                    () => (
                        <Alert
                            small={true}
                            description="La création du compte est en cours, tu recevras un
                            email quand ce sera bon..."
                            severity="info"
                        />
                    ),
                )
                .with(
                    { status: ACCOUNT_SERVICE_STATUS.ACCOUNT_INVITATION_SENT },
                    () => (
                        <Alert
                            description={
                                "Une invitation t'a été envoyée par email."
                            }
                            small={true}
                            closable={false}
                            severity="info"
                        />
                    ),
                )
                .exhaustive()}
        </>
    );
};

export default AccountDetails;

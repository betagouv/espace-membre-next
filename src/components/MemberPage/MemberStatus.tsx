import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";
import Table from "@codegouvfr/react-dsfr/Table";
import { match, P } from "ts-pattern";

import { MemberPageProps } from "./MemberPage";
import { askAccountCreationForService } from "@/app/api/services/actions";
import { ToolTip } from "@/components/Tooltip";
import { EmailStatusCode } from "@/models/member";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";
import { SERVICES } from "@/server/config/services.config";
import { EMAIL_TYPES } from "@/server/modules/email";

const mattermostInfoRow = (
    mattermostInfo: NonNullable<MemberPageProps["mattermostInfo"]>,
    userUuid: string
) => {
    return [
        "Compte Mattermost",
        match(mattermostInfo)
            .when(
                (info) =>
                    info.hasMattermostAccount &&
                    typeof info.mattermostUserName === "string",
                (info) => (
                    <div>
                        {match(info.isInactiveOrNotInTeam)
                            .with(true, () => (
                                <Badge severity="error">Inactif</Badge>
                            ))
                            .with(false, () => (
                                <Badge severity="success">Actif</Badge>
                            ))
                            .exhaustive()}
                    </div>
                )
            )
            .otherwise(() => <Badge severity="info">Compte introuvable</Badge>),
        match(mattermostInfo)
            .when(
                (info) =>
                    info.hasMattermostAccount &&
                    typeof info.mattermostUserName === "string",
                (info) => <>@{info.mattermostUserName}</>
            )
            .otherwise(() => (
                <Button
                    onClick={async () => {
                        console.log("LCS DEMNADER UN COUNNT");
                        try {
                            await askAccountCreationForService({
                                userUuid,
                                password: "dummypassword",
                                service: SERVICES.MATTERMOST,
                            });
                            console.log(
                                "La creation du compte mattermost est en cours"
                            );
                        } catch (e) {
                            console.log(
                                "Error caling mattermost account creation"
                            );
                        }
                    }}
                >
                    Demander la création d'un compte
                </Button>
            )),
        // .otherwise(
        //     () =>
        //         "Le compte est introuvable : soit il n'existe pas, soit il est désactivé, soit il est lié à une adresse email inconnue."
        // ),
    ];
};

const emailStatusRow = (
    emailInfos: MemberPageProps["emailInfos"],
    userInfos: MemberPageProps["userInfos"]
) => {
    return [
        <>Email Beta</>,
        match(emailInfos)
            .when(
                (emailInfos) => !!emailInfos,
                () => {
                    return match(userInfos.primary_email_status)
                        .with(EmailStatusCode.EMAIL_SUSPENDED, () => (
                            <Badge severity="warning">Suspendu</Badge>
                        ))
                        .with(
                            P.union(
                                EmailStatusCode.EMAIL_ACTIVE,
                                EmailStatusCode.EMAIL_REDIRECTION_ACTIVE
                            ),
                            () => <Badge severity="success">Actif</Badge>
                        )
                        .with(
                            P.union(
                                EmailStatusCode.EMAIL_CREATION_WAITING,
                                EmailStatusCode.EMAIL_CREATION_PENDING,
                                EmailStatusCode.EMAIL_RECREATION_PENDING,
                                EmailStatusCode.EMAIL_REDIRECTION_PENDING
                            ),
                            () => (
                                <Badge severity="success">
                                    Creation en cours
                                </Badge>
                            )
                        )
                        .with(
                            P.union(
                                EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING,
                                EmailStatusCode.EMAIL_VERIFICATION_WAITING
                            ),
                            () => (
                                <Badge severity="warning">
                                    Action nécessaire
                                </Badge>
                            )
                        )
                        .with(
                            P.union(
                                EmailStatusCode.EMAIL_DELETED,
                                EmailStatusCode.EMAIL_EXPIRED,
                                EmailStatusCode.EMAIL_UNSET
                            ),
                            () => (
                                <Badge severity="warning">
                                    Action Nécessaire
                                </Badge>
                            )
                        )
                        .exhaustive();
                }
            )
            .when(
                (emailInfos) => !emailInfos,
                () =>
                    match(userInfos.primary_email_status)
                        .with(
                            P.union(
                                EmailStatusCode.EMAIL_CREATION_WAITING,
                                EmailStatusCode.EMAIL_CREATION_PENDING,
                                EmailStatusCode.EMAIL_RECREATION_PENDING,
                                EmailStatusCode.EMAIL_REDIRECTION_PENDING
                            ),
                            () => (
                                <Badge severity="success">
                                    Creation en cours
                                </Badge>
                            )
                        )
                        .with(
                            P.union(EmailStatusCode.EMAIL_VERIFICATION_WAITING),
                            () => (
                                <Badge severity="warning">
                                    Action nécessaire
                                </Badge>
                            )
                        )
                        .with(
                            P.union(
                                EmailStatusCode.EMAIL_DELETED,
                                EmailStatusCode.EMAIL_EXPIRED,
                                EmailStatusCode.EMAIL_UNSET
                            ),
                            () => <>Pas d'email beta</>
                        )
                        .otherwise(() => (
                            <Badge severity="warning">Action nécessaire</Badge>
                        ))
            )
            .otherwise(() => <>Pas d'email beta</>),
        <>
            {match(emailInfos)
                .with({ isPro: true }, () => (
                    <Badge noIcon={true}>offre OVH PRO</Badge>
                ))
                .with({ isExchange: true }, () => (
                    <Badge noIcon={true}>offre Exchange</Badge>
                ))
                .with({ emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC }, () => (
                    <Badge noIcon={true}>offre OVH MX</Badge>
                ))
                .otherwise(() => "?")}
            {match(emailInfos)
                .when(
                    (emailInfos) => !!emailInfos,
                    () => {
                        return match(userInfos.primary_email_status)
                            .with(EmailStatusCode.EMAIL_SUSPENDED, () => (
                                <>
                                    <br />
                                    Le mot de passe doit etre mis-à-jour afin de
                                    réactiver le compte
                                </>
                            ))
                            .with(
                                P.union(
                                    EmailStatusCode.EMAIL_CREATION_WAITING,
                                    EmailStatusCode.EMAIL_CREATION_PENDING,
                                    EmailStatusCode.EMAIL_RECREATION_PENDING,
                                    EmailStatusCode.EMAIL_REDIRECTION_PENDING
                                ),
                                () => (
                                    <>
                                        <br />
                                        La creation de l'email est en cours.
                                    </>
                                )
                            )
                            .with(
                                P.union(
                                    EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING
                                ),
                                () => (
                                    <>
                                        <br />
                                        Le mot de passe doit être défini
                                    </>
                                )
                            )
                            .with(
                                P.union(
                                    EmailStatusCode.EMAIL_DELETED,
                                    EmailStatusCode.EMAIL_EXPIRED,
                                    EmailStatusCode.EMAIL_UNSET
                                ),
                                () => (
                                    <>
                                        <br />
                                        Un admin doit intervenir. Le compte
                                        email existe mais est indiqué comme
                                        supprimé ou non défini dans
                                        l'espace-membre
                                    </>
                                )
                            )
                            .otherwise(() => null);
                    }
                )
                .when(
                    (emailInfos) => !emailInfos,
                    () =>
                        match(userInfos.primary_email_status)
                            .with(
                                P.union(
                                    EmailStatusCode.EMAIL_CREATION_WAITING,
                                    EmailStatusCode.EMAIL_CREATION_PENDING,
                                    EmailStatusCode.EMAIL_RECREATION_PENDING,
                                    EmailStatusCode.EMAIL_REDIRECTION_PENDING
                                ),
                                () => (
                                    <Badge severity="success">
                                        Creation en cours
                                    </Badge>
                                )
                            )
                            .with(
                                P.union(
                                    EmailStatusCode.EMAIL_VERIFICATION_WAITING
                                ),
                                () =>
                                    "Les informations du compte doivent être vérifiés par le membre"
                            )
                            .with(
                                P.union(
                                    EmailStatusCode.EMAIL_DELETED,
                                    EmailStatusCode.EMAIL_EXPIRED,
                                    EmailStatusCode.EMAIL_UNSET
                                ),
                                () => null
                            )
                            .otherwise(
                                () =>
                                    "Un admin doit intervenir, le compte est dans un état inattendu"
                            )
                )
                .otherwise(() => (
                    <>Pas d'email beta</>
                ))}
        </>,
    ];
};

const matomoInfoRow = (matomo: NonNullable<MemberPageProps["matomoInfo"]>) => {
    return [
        <>Compte Matomo</>,
        <Badge key="matomo-status" severity="success">
            Actif
        </Badge>,
        <Accordion key="matomo-access" label={"Liste des accès"}>
            <Table
                data={matomo.metadata.sites.map((s) => [
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
        </Accordion>,
    ];
};

const sentryInfoRow = (sentry: NonNullable<MemberPageProps["sentryInfo"]>) => {
    return [
        <>Compte Sentry</>,
        <Badge key="sentry-status" severity="success">
            Actif
        </Badge>,
        <Accordion key="sentry-info" label={"Liste des accès"}>
            <Table
                data={sentry.metadata.teams.map((s) => [
                    s.slug ? (
                        <a href={s.slug} target="_blank">
                            {s.name}
                        </a>
                    ) : (
                        s.name
                    ),
                    s.projects.length,
                    s.role,
                ])}
                headers={["nom", "projets", "niveau d'accès"]}
            />
        </Accordion>,
    ];
};

export const MemberStatus = ({
    isExpired,
    emailInfos,
    mattermostInfo,
    userInfos,
    redirections,
    matomoInfo,
    sentryInfo,
}: {
    isExpired: MemberPageProps["isExpired"];
    emailInfos: MemberPageProps["emailInfos"];
    mattermostInfo: MemberPageProps["mattermostInfo"];
    userInfos: MemberPageProps["userInfos"];
    redirections: MemberPageProps["redirections"];
    matomoInfo: MemberPageProps["matomoInfo"];
    sentryInfo: MemberPageProps["sentryInfo"];
}) => {
    const rows = [
        // Account status
        [
            <>Compte beta</>,
            match(isExpired)
                .with(true, () => <Badge severity="error">Expiré</Badge>)
                .with(false, () => <Badge severity="success">Actif</Badge>)
                .exhaustive(),
            match(isExpired)
                .with(true, () => <>Plus de missions en cours.</>)
                .with(false, () => <>Au moins une mission en cours.</>)
                .exhaustive(),
        ],
        emailStatusRow(emailInfos, userInfos),
        // Mattermost account status
        mattermostInfo && mattermostInfoRow(mattermostInfo, userInfos.uuid),
        // Matomo account status
        matomoInfo && matomoInfoRow(matomoInfo),
        // Sentry account status
        sentryInfo && sentryInfoRow(sentryInfo),
    ].filter((z) => !!z);

    return (
        <Table
            className="tbl-account-status"
            headers={["Service", "Status", "Infos"]}
            data={rows}
        />
    );
};

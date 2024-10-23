import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { fr } from "@codegouvfr/react-dsfr/fr";
import Table from "@codegouvfr/react-dsfr/Table";
import { match } from "ts-pattern";

import { MemberPageProps } from "./MemberPage";
import { ToolTip } from "@/components/Tooltip";

const mattermostInfoRow = (
    mattermostInfo: NonNullable<MemberPageProps["mattermostInfo"]>
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
            .otherwise(() => (
                <Badge severity="warning">Compte introuvable</Badge>
            )),
        match(mattermostInfo)
            .when(
                (info) =>
                    info.hasMattermostAccount &&
                    typeof info.mattermostUserName === "string",
                (info) => <>@{info.mattermostUserName}</>
            )
            .otherwise(
                () =>
                    "Le compte est introuvable : soit il n'existe pas, soit il est désactivé, soit il est lié à une adresse email inconnue."
            ),
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
                fixed
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
                fixed
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
                .with(false, () => <>Au moins mission en cours.</>)
                .exhaustive(),
        ],
        // Mattermost account status
        mattermostInfo && mattermostInfoRow(mattermostInfo),
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

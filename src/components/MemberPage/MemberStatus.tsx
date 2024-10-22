import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { fr } from "@codegouvfr/react-dsfr/fr";
import Table from "@codegouvfr/react-dsfr/Table";
import { match } from "ts-pattern"; // import ts-pattern

import { MemberPageProps } from "./MemberPage";
import { EmailStatusCode } from "@/models/member";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";

const EmailLink = ({ email }: { email: string }) => (
    <a href={`mailto:${email}`}>{email}</a>
);

const ToolTip = ({
    id,
    children,
}: {
    id: string;
    children: React.ReactNode;
}) => (
    <>
        <button
            aria-describedby={`tooltip-${id}`}
            className={fr.cx("fr-btn--tooltip", "fr-btn")}
        >
            Information contextuelle
        </button>
        <span
            className={fr.cx("fr-tooltip", "fr-placement")}
            id={`tooltip-${id}`}
            role="tooltip"
        >
            {children}
        </span>
    </>
);

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
                    <>
                        <Badge severity="info" className={fr.cx("fr-mr-1w")}>
                            {info.mattermostUserName as string}
                        </Badge>
                        {match(info.isInactiveOrNotInTeam)
                            .with(true, () => (
                                <Badge severity="error">Inactif</Badge>
                            ))
                            .with(false, () => (
                                <Badge severity="success">Actif</Badge>
                            ))
                            .exhaustive()}
                    </>
                )
            )
            .otherwise(() => (
                <Badge severity="error">Compte introuvable</Badge>
            )),
    ];
};

const matomoInfoRow = (matomo: NonNullable<MemberPageProps["matomoInfo"]>) => {
    return [
        <>Compte Matomo</>,
        <div key="matomo-info">
            <Accordion
                key={"d"}
                label={
                    <>
                        <Badge severity="success">Actif</Badge> - Liste des
                        accès
                    </>
                }
            >
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
            </Accordion>
        </div>,
    ];
};

const sentryInfoRow = (sentry: NonNullable<MemberPageProps["sentryInfo"]>) => {
    return [
        <>Compte Sentry</>,
        <div key="sentry-info">
            <Accordion
                key={"d"}
                label={
                    <>
                        <Badge severity="success">Actif</Badge> - Liste des
                        accès
                    </>
                }
            >
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
            </Accordion>
        </div>,
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
            <>
                Compte beta
                <ToolTip id="compte-beta">
                    Indique si ton compte membre beta.gouv.fr est actif
                </ToolTip>
            </>,
            match(isExpired)
                .with(true, () => <Badge severity="error">Expiré</Badge>)
                .with(false, () => <Badge severity="success">Actif</Badge>)
                .exhaustive(),
        ],
        // // Email status
        // emailInfos && emailStatusRow(emailInfos, userInfos),
        // // Spam status
        // emailInfos && emailSpamInfoRow(emailInfos),
        // // Redirections
        // ...redirections.map((redirection) => redirectionRow(redirection)),
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
            fixed
            headers={["Service", "Infos"]}
            data={rows}
        />
    );
};

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

const emailStatusRow = (
    emailInfos: NonNullable<MemberPageProps["emailInfos"]>,
    userInfos: MemberPageProps["userInfos"]
) => {
    return [
        <>
            Statut de l'email <EmailLink email={emailInfos.email} />
        </>,
        <>
            <Badge severity="info" className={fr.cx("fr-mr-1w")}>
                {match(emailInfos)
                    .with({ isPro: true }, () => "OVH PRO")
                    .with({ isExchange: true }, () => "Exchange")
                    .with(
                        { emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC },
                        () => "OVH MX"
                    )
                    .otherwise(() => "?")}
            </Badge>
            {match(userInfos.primary_email_status)
                .with(EmailStatusCode.EMAIL_ACTIVE, () => (
                    <Badge severity="success">Actif</Badge>
                ))
                .otherwise(() => (
                    <Badge severity="error">
                        {
                            EMAIL_STATUS_READABLE_FORMAT[
                                userInfos.primary_email_status
                            ]
                        }
                    </Badge>
                ))}
        </>,
    ];
};

const emailSpamInfoRow = (
    emailInfos: NonNullable<MemberPageProps["emailInfos"]>
) => {
    return [
        <>
            Email <EmailLink email={emailInfos.email} /> classé en spam OVH
        </>,
        match(emailInfos.isBlocked)
            .with(true, () => <Badge severity="error">Oui</Badge>)
            .otherwise(() => <Badge severity="success">Non</Badge>),
    ];
};

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

const redirectionRow = (
    redirection: NonNullable<MemberPageProps["redirections"][0]>
) => {
    return [
        <>
            Redirection <EmailLink email={redirection.from} /> vers{" "}
            <EmailLink email={redirection.to} />.
        </>,
        <Badge key={redirection.to} severity="success">
            OK
        </Badge>,
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

export const MemberStatus = ({
    isExpired,
    emailInfos,
    mattermostInfo,
    userInfos,
    redirections,
    matomoInfo,
}: {
    isExpired: MemberPageProps["isExpired"];
    emailInfos: MemberPageProps["emailInfos"];
    mattermostInfo: MemberPageProps["mattermostInfo"];
    userInfos: MemberPageProps["userInfos"];
    redirections: MemberPageProps["redirections"];
    matomoInfo: MemberPageProps["matomoInfo"];
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
        // Email status
        emailInfos && emailStatusRow(emailInfos, userInfos),
        // Spam status
        emailInfos && emailSpamInfoRow(emailInfos),
        // Redirections
        ...redirections.map((redirection) => redirectionRow(redirection)),
        // Mattermost account status
        mattermostInfo && mattermostInfoRow(mattermostInfo),
        // Matomo account status
        matomoInfo && matomoInfoRow(matomoInfo),
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

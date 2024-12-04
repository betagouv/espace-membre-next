"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Table from "@codegouvfr/react-dsfr/Table";
import { match } from "ts-pattern";

import BlocChangerMotDePasse from "./BlocChangerMotDePasse";
import BlocConfigurerCommunicationEmail from "./BlocConfigurerCommunicationEmail";
import BlocConfigurerEmailPrincipal from "./BlocConfigurerEmailPrincipal";
import BlocConfigurerEmailSecondaire from "./BlocConfigurerEmailSecondaire";
import BlocCreateEmail from "./BlocCreateEmail";
import BlocEmailResponder from "./BlocEmailResponder";
import BlocRedirection from "./BlocRedirection";
import { WebMailButton } from "./WebMailButton";
import { MemberPageProps } from "../MemberPage";
import frontConfig from "@/frontConfig";
import {
    EmailInfos,
    memberSchemaType,
    memberWrapperSchemaType,
} from "@/models/member";
import { EmailStatusCode } from "@/models/member";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";
import { EMAIL_PLAN_TYPE, OvhRedirection, OvhResponder } from "@/models/ovh";

const EmailLink = ({ email }: { email: string }) => (
    <a href={`mailto:${email}`}>{email}</a>
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

function BlocEmailConfiguration({ emailInfos }: { emailInfos: EmailInfos }) {
    interface ServerConf {
        server: string;
        method: string;
        port: string;
    }
    enum EmailPlan {
        pro = "pro",
        exchange = "exchange",
        mx = "mx",
    }
    const conf: { [key in EmailPlan]: { smtp: ServerConf; imap: ServerConf } } =
        {
            pro: {
                smtp: {
                    server: "pro1.mail.ovh.net",
                    method: "TLS",
                    port: "587",
                },
                imap: {
                    server: "pro1.mail.ovh.net",
                    method: "SSL",
                    port: "993",
                },
            },
            exchange: {
                smtp: {
                    server: "ex3.mail.ovh.fr",
                    method: "TLS",
                    port: "587",
                },
                imap: {
                    server: "ex3.mail.ovh.net",
                    method: "SSL",
                    port: "993",
                },
            },
            mx: {
                smtp: {
                    server: "ssl0.ovh.net",
                    method: "TLS",
                    port: "587",
                },
                imap: {
                    server: "ssl0.ovh.net",
                    method: "SSL",
                    port: "993",
                },
            },
        };
    let plan = "mx";
    if (emailInfos.isPro) {
        plan = "pro";
    } else if (emailInfos.isExchange) {
        plan = "exchange";
    }
    return (
        <Accordion label="Configurer ton email beta">
            <p>
                Configure ton client mail préféré (Mail, Thunderbird,
                Mailspring, Microsoft Courier, Gmail, etc) pour recevoir et
                envoyer des emails. D'avantage d'info ici :{" "}
                <a
                    href="https://doc.incubateur.net/communaute/travailler-a-beta-gouv/jutilise-les-outils-de-la-communaute/emails/envoyer-et-recevoir-des-mails-beta.gouv.fr"
                    target="_blank"
                    className="button no-margin"
                >
                    documentation de configuration du webmail
                </a>
            </p>
            {["imap", "smtp"].map((confType) => (
                <Table
                    key={confType}
                    caption={confType}
                    data={[
                        ["Serveur", conf[plan][confType].server],
                        ["Port", conf[plan][confType].port],
                        ["Méthode de chiffrement", conf[plan][confType].method],
                        [`Nom d'utilisateur`, emailInfos.email],
                        ["Mot de passe", "Le mot de passe de ton email"],
                    ]}
                    headers={["Paramètre", "Valeur"]}
                />
            ))}
        </Accordion>
    );
}

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

export default function EmailContainer({
    userInfos,
    emailInfos,
    emailResponder,
    emailRedirections,
    authorizations: {
        canCreateEmail,
        canChangeEmails,
        canChangePassword,
        canCreateRedirection,
        hasPublicServiceEmail,
    },
    redirections,
    isExpired,
    isCurrentUser,
}: {
    userInfos: memberSchemaType;
    isExpired: boolean;
    emailInfos: EmailInfos | null;
    emailRedirections: OvhRedirection[];
    emailResponder: OvhResponder | null;
    redirections: MemberPageProps["redirections"];
    authorizations: memberWrapperSchemaType["authorizations"];
    isCurrentUser: boolean;
}) {
    const emailIsBeingCreated = [
        EmailStatusCode.EMAIL_CREATION_WAITING,
        EmailStatusCode.EMAIL_CREATION_PENDING,
    ].includes(userInfos.primary_email_status);

    const rows = [
        // Email status
        emailInfos && emailStatusRow(emailInfos, userInfos),
        // Spam status
        emailInfos && emailSpamInfoRow(emailInfos),
        // Redirections
        ...redirections.map((redirection) => redirectionRow(redirection)),
    ].filter((z) => !!z);

    return (
        <div className="fr-mb-14v">
            <h2>Email</h2>
            <div>
                {emailInfos && (
                    <>
                        <span className="font-weight-bold">
                            Email principal :{" "}
                        </span>
                        <span className="font-weight-bold text-color-blue">
                            <a href={`mailto:${emailInfos.email}`}>
                                {emailInfos.email}
                            </a>

                            {match(emailInfos)
                                .with({ isPro: true }, () => (
                                    <Badge
                                        small
                                        className={fr.cx("fr-ml-1w")}
                                        severity="info"
                                    >
                                        OVH Pro
                                    </Badge>
                                ))
                                .with({ isExchange: true }, () => (
                                    <Badge
                                        small
                                        className={fr.cx("fr-ml-1w")}
                                        severity="info"
                                    >
                                        OVH Exchange
                                    </Badge>
                                ))
                                .with(
                                    {
                                        emailPlan:
                                            EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC,
                                    },
                                    () => (
                                        <Badge
                                            small
                                            className={fr.cx("fr-ml-1w")}
                                            severity="info"
                                        >
                                            OVH MX
                                        </Badge>
                                    )
                                )
                                .otherwise(() => null)}
                            {userInfos.primary_email_status !==
                                EmailStatusCode.EMAIL_ACTIVE && (
                                <Badge
                                    severity="error"
                                    small
                                    className={fr.cx("fr-ml-1w")}
                                >
                                    {
                                        EMAIL_STATUS_READABLE_FORMAT[
                                            userInfos.primary_email_status
                                        ]
                                    }
                                </Badge>
                            )}
                        </span>
                        <br />
                    </>
                )}
                {!emailInfos && userInfos.primary_email && (
                    <>
                        <span className="font-weight-bold">
                            Email principal :{" "}
                        </span>
                        <span className="font-weight-bold text-color-blue">
                            <a href={`mailto:${userInfos.primary_email}`}>
                                {userInfos.primary_email}
                            </a>
                        </span>
                        <br />
                    </>
                )}
                <span className="font-weight-bold">Email secondaire : </span>{" "}
                {userInfos.secondary_email ? (
                    <a href={`mailto:${userInfos.secondary_email}`}>
                        {userInfos.secondary_email}
                    </a>
                ) : (
                    "Non renseigné"
                )}
            </div>
            <br />
            {!emailIsBeingCreated && emailInfos && (
                <WebMailButton
                    isExchange={!!emailInfos.isExchange}
                    className={fr.cx("fr-mb-2w")}
                />
            )}
            {!!emailIsBeingCreated && (
                <Alert
                    description="Ton email @beta.gouv.fr est en train d'être créé, tu recevras un email dès que celui-ci est actif."
                    severity="info"
                    className={fr.cx("fr-mb-4w")}
                    small
                />
            )}
            <Table
                className="tbl-account-status"
                fixed
                headers={["Service", "Infos"]}
                data={rows}
            />
            {!emailIsBeingCreated && isCurrentUser && (
                <div className={fr.cx("fr-accordions-group")}>
                    {match(userInfos.primary_email_status)
                        .with(
                            EmailStatusCode.EMAIL_CREATION_WAITING,
                            EmailStatusCode.EMAIL_CREATION_PENDING,
                            () => null
                        )
                        .otherwise(
                            () =>
                                canCreateEmail && (
                                    <BlocCreateEmail
                                        hasPublicServiceEmail={
                                            hasPublicServiceEmail
                                        }
                                        userInfos={userInfos}
                                    />
                                )
                        )}

                    {!!emailInfos && (
                        <BlocEmailConfiguration emailInfos={emailInfos} />
                    )}

                    {match(emailInfos)
                        .with(
                            { emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC },
                            () => (
                                <BlocEmailResponder
                                    username={userInfos.username}
                                    responder={emailResponder}
                                />
                            )
                        )
                        .otherwise(() => null)}

                    <BlocChangerMotDePasse
                        canChangePassword={canChangePassword}
                        status={userInfos.primary_email_status}
                        userInfos={userInfos}
                    />

                    {match(emailInfos)
                        .with(
                            { emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC },
                            () => (
                                <BlocRedirection
                                    redirections={emailRedirections}
                                    canCreateRedirection={canCreateRedirection}
                                    userInfos={userInfos}
                                    isExpired={isExpired}
                                    domain={frontConfig.domain}
                                />
                            )
                        )
                        .otherwise(() => null)}

                    <BlocConfigurerEmailPrincipal
                        canChangeEmails={canChangeEmails}
                        userInfos={userInfos}
                    />

                    <BlocConfigurerEmailSecondaire
                        canChangeEmails={canChangeEmails}
                        secondaryEmail={userInfos.secondary_email}
                    />

                    <BlocConfigurerCommunicationEmail userInfos={userInfos} />
                </div>
            )}
        </div>
    );
}

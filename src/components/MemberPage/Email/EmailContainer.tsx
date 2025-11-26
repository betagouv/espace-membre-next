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
import BlocEmailResponder from "./BlocEmailResponder";
import BlocRedirection from "./BlocRedirection";
import { WebMailButtons } from "./WebMailButtons";
import { MemberPageProps } from "../MemberPage";
import { BadgeEmailPlan } from "@/components/BadgeEmailPlan";
import frontConfig from "@/frontConfig";
import {
  EmailInfos,
  memberSchemaType,
  memberWrapperSchemaType,
  EmailStatusCode,
} from "@/models/member";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";
import { EMAIL_PLAN_TYPE, OvhRedirection, OvhResponder } from "@/models/ovh";
import { DimailCreateMailButton } from "./DimailCreateMailButton";

const EmailLink = ({ email }: { email: string }) => (
  <a href={`mailto:${email}`}>{email}</a>
);

const emailStatusRow = (
  emailInfos: NonNullable<MemberPageProps["emailInfos"]>,
  userInfos: MemberPageProps["userInfos"],
) => {
  return [
    <>
      Statut de l'email <EmailLink email={emailInfos.email} />
    </>,
    <>
      <Badge severity="info" className={fr.cx("fr-mr-1w")} as="span">
        {match(emailInfos.emailPlan)
          .with(EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO, () => "OVH PRO")
          .with(EMAIL_PLAN_TYPE.EMAIL_PLAN_EXCHANGE, () => "Exchange")
          .with(EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC, () => "OVH MX")
          .with(EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI, () => "Suite numérique")
          .exhaustive()}
      </Badge>
      {match(userInfos.primary_email_status)
        .with(EmailStatusCode.EMAIL_ACTIVE, () => (
          <Badge severity="success" as="span">
            Actif
          </Badge>
        ))
        .otherwise(() => (
          <Badge severity="error" as="span">
            {EMAIL_STATUS_READABLE_FORMAT[userInfos.primary_email_status]}
          </Badge>
        ))}
      {userInfos.primary_email_status ===
        EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING && (
        <span>
          Le mot de passe doit être défini. Rendez vous dans{" "}
          <a href={"/account?tab=compte-email#password"}>
            Changer mon mot de passe
          </a>
        </span>
      )}
    </>,
  ];
};

const emailSpamInfoRow = (
  emailInfos: NonNullable<MemberPageProps["emailInfos"]>,
) => {
  return [
    <>
      Email <EmailLink email={emailInfos.email} /> classé en spam OVH
    </>,
    match(emailInfos.isBlocked)
      .with(true, () => (
        <Badge severity="error" as="span">
          Oui
        </Badge>
      ))
      .otherwise(() => (
        <Badge severity="success" as="span">
          Non
        </Badge>
      )),
  ];
};

function BlocEmailConfiguration({ emailInfos }: { emailInfos: EmailInfos }) {
  interface ServerConf {
    server: string;
    method: string;
    port: string;
  }
  const conf: {
    [key in EMAIL_PLAN_TYPE]: {
      smtp: ServerConf;
      imap: ServerConf;
      documentation: string;
    };
  } = {
    [EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO]: {
      documentation:
        "https://doc.incubateur.net/communaute/les-outils-de-la-communaute/emails/emails-ovh-pro",
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
    [EMAIL_PLAN_TYPE.EMAIL_PLAN_EXCHANGE]: {
      documentation:
        "https://help.ovhcloud.com/csm/fr-exchange-macos-mailapp-configuration?id=kb_article_view&sysparm_article=KB0053382",
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
    [EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC]: {
      documentation:
        "https://doc.incubateur.net/communaute/les-outils-de-la-communaute/emails/envoyer-et-recevoir-des-emails-beta.gouv.fr-avec-loffre-ovh-mx-plan",
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
    [EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI]: {
      documentation:
        "https://doc.incubateur.net/communaute/les-outils-de-la-communaute/emails/emails-suite-numerique",
      smtp: {
        server: "smtp.beta.gouv.fr",
        method: "TLS",
        port: "587",
      },
      imap: {
        server: "imap.beta.gouv.fr",
        method: "SSL",
        port: "993",
      },
    },
  };
  const planConf = conf[emailInfos.emailPlan];
  return (
    <Accordion label="Configurer ton email beta">
      <p>
        Configure ton client mail préféré (Mail, Thunderbird, Mailspring,
        Microsoft Courier, Gmail, etc) pour recevoir et envoyer des emails.
        D'avantage d'info ici :{" "}
        <a
          href={planConf.documentation}
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
            ["Serveur", planConf[confType].server],
            ["Port", planConf[confType].port],
            ["Méthode de chiffrement", planConf[confType].method],
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
  redirection: NonNullable<MemberPageProps["redirections"][0]>,
) => {
  return [
    <>
      Redirection <EmailLink email={redirection.from} /> vers{" "}
      <EmailLink email={redirection.to} />.
    </>,
    <Badge key={redirection.to} severity="success" as="span">
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

  const isDinumEmail = emailInfos?.emailPlan === EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI;

  const rows = [
    // Email status
    emailInfos && emailStatusRow(emailInfos, userInfos),
    // Spam status (ovh only)
    !isDinumEmail && emailInfos && emailSpamInfoRow(emailInfos),
    // Redirections
    ...redirections.map((redirection) => redirectionRow(redirection)),
  ].filter((z) => !!z);

  const infoStatus = [
    EmailStatusCode.EMAIL_RECREATION_PENDING,
    EmailStatusCode.EMAIL_CREATION_WAITING,
    EmailStatusCode.EMAIL_CREATION_PENDING,
    EmailStatusCode.EMAIL_REDIRECTION_PENDING,
    EmailStatusCode.EMAIL_VERIFICATION_WAITING,
  ];

  return (
    <div className="fr-mb-14v">
      <h2>Email</h2>
      <div>
        {emailInfos && (
          <>
            <span className="font-weight-bold">Email principal : </span>
            <span className="font-weight-bold text-color-blue">
              <a href={`mailto:${emailInfos.email}`}>{emailInfos.email}</a>
              <BadgeEmailPlan plan={emailInfos.emailPlan} />
              {userInfos.primary_email_status !==
                EmailStatusCode.EMAIL_ACTIVE && (
                <Badge
                  as="span"
                  severity={
                    infoStatus.includes(userInfos.primary_email_status)
                      ? "info"
                      : "error"
                  }
                  small
                  className={fr.cx("fr-ml-1w")}
                >
                  {EMAIL_STATUS_READABLE_FORMAT[userInfos.primary_email_status]}
                </Badge>
              )}
            </span>
            <br />
          </>
        )}
        {!emailInfos && userInfos.primary_email && (
          <>
            <span className="font-weight-bold">Email principal : </span>
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
        <div className={fr.cx("fr-grid-row")}>
          <WebMailButtons plan={emailInfos.emailPlan} />
        </div>
      )}
      {!!emailIsBeingCreated && (
        <Alert
          description={`Ton email @beta.gouv.fr est en train d'être créé, tu recevras un email sur ${userInfos.secondary_email} dès que celui-ci sera actif.`}
          severity="info"
          className={fr.cx("fr-mb-4w")}
          small
        />
      )}
      {rows.length ? (
        <Table
          className="tbl-account-status"
          fixed
          headers={["Service", "Infos"]}
          data={rows}
        />
      ) : null}
      {isDinumEmail ? (
        <>
          <BlocEmailConfiguration emailInfos={emailInfos} />
        </>
      ) : isCurrentUser ? (
        /* affiche la migration dimail que si c'est un email non dimail et que c'est l'utilisateur lui-même */
        <DimailCreateMailButton
          userUuid={userInfos.uuid}
          userInfos={userInfos}
        />
      ) : null}
      {!emailIsBeingCreated && isCurrentUser && (
        <div className={fr.cx("fr-accordions-group")}>
          {!!emailInfos && !isDinumEmail && (
            <>
              <BlocEmailConfiguration emailInfos={emailInfos} />
            </>
          )}

          {!isDinumEmail &&
            emailInfos &&
            emailInfos.emailPlan === EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC && (
              <>
                <BlocEmailResponder
                  username={userInfos.username}
                  responder={emailResponder}
                />
                <BlocRedirection
                  redirections={emailRedirections}
                  canCreateRedirection={canCreateRedirection}
                  userInfos={userInfos}
                  isExpired={isExpired}
                  domain={frontConfig.domain}
                />
              </>
            )}

          {!isDinumEmail && (
            <BlocChangerMotDePasse
              canChangePassword={canChangePassword}
              status={userInfos.primary_email_status}
              userInfos={userInfos}
            />
          )}

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

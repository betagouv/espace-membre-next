import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import { match, P } from "ts-pattern";

import { MemberPageProps } from "./MemberPage";
import { BadgeEmailPlan } from "../BadgeEmailPlan";
import { EmailStatusCode } from "@/models/member";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";
import { ACCOUNT_SERVICE_STATUS } from "@/models/services";

const legacyEmailStatuses = P.union(
  EmailStatusCode.EMAIL_REDIRECTION_ACTIVE,
  EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING,
  EmailStatusCode.EMAIL_CREATION_PENDING,
  EmailStatusCode.EMAIL_RECREATION_PENDING,
  EmailStatusCode.EMAIL_REDIRECTION_PENDING,
  EmailStatusCode.EMAIL_EXPIRED,
  EmailStatusCode.EMAIL_UNSET,
);

const mattermostInfoRow = (
  mattermostInfo: NonNullable<MemberPageProps["mattermostInfo"]>,
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
                <Badge severity="error" as="span">
                  Inactif
                </Badge>
              ))
              .with(false, () => (
                <Badge severity="success" as="span">
                  Actif
                </Badge>
              ))
              .exhaustive()}
          </div>
        ),
      )
      .otherwise(() => (
        <Badge severity="warning" as="span">
          introuvable
        </Badge>
      )),
    match(mattermostInfo)
      .when(
        (info) =>
          info.hasMattermostAccount &&
          typeof info.mattermostUserName === "string",
        (info) => <>@{info.mattermostUserName}</>,
      )
      .otherwise(
        () =>
          "Le compte est introuvable : soit il n'existe pas, soit il est désactivé, soit il est lié à une adresse email inconnue.",
      ),
  ];
};

const emailStatusRow = (
  emailInfos: MemberPageProps["emailInfos"],
  userInfos: MemberPageProps["userInfos"],
) => {
  return [
    <>Email Beta</>,
    match(userInfos.primary_email_status)
      .with(EmailStatusCode.EMAIL_SUSPENDED, () => (
        <Badge severity="warning" as="span">
          Suspendu
        </Badge>
      ))
      .with(EmailStatusCode.EMAIL_DELETED, () => (
        <Badge severity="warning" as="span">
          Supprimé
        </Badge>
      ))
      .with(P.union(EmailStatusCode.EMAIL_ACTIVE), () => (
        <Badge severity="success" as="span">
          Actif
        </Badge>
      ))
      .with(P.union(EmailStatusCode.EMAIL_CREATION_WAITING), () => (
        <Badge severity="success" as="span">
          Création en cours
        </Badge>
      ))
      .with(
        P.union(
          EmailStatusCode.EMAIL_VERIFICATION_WAITING,
          EmailStatusCode.MEMBER_VALIDATION_WAITING,
        ),
        () => (
          <Badge severity="warning" as="span">
            {userInfos.primary_email_status}
          </Badge>
        ),
      )
      .with(legacyEmailStatuses, () => <>{userInfos.primary_email_status}</>)
      .exhaustive(),
    <>
      {emailInfos && <BadgeEmailPlan plan={emailInfos.emailPlan} />}

      {match(userInfos.primary_email_status)
        .with(EmailStatusCode.EMAIL_ACTIVE, () => null)
        .with(EmailStatusCode.EMAIL_SUSPENDED, () => (
          <>
            <br />
            Le compte a été suspendu et sera réactivé automatiquement.
          </>
        ))
        .with(EmailStatusCode.EMAIL_DELETED, () => (
          <>
            <br />
            Le compte a été supprimé et sera réactivé prochainement
          </>
        ))
        .with(P.union(EmailStatusCode.EMAIL_CREATION_WAITING), () => (
          <>
            <br />
            La creation de l'email est en cours.
          </>
        ))
        .with(EmailStatusCode.MEMBER_VALIDATION_WAITING, () => (
          <>
            <br />
            {
              EMAIL_STATUS_READABLE_FORMAT[
                EmailStatusCode.MEMBER_VALIDATION_WAITING
              ]
            }
          </>
        ))
        .with(EmailStatusCode.EMAIL_VERIFICATION_WAITING, () => (
          <>
            <br />
            {
              EMAIL_STATUS_READABLE_FORMAT[
                EmailStatusCode.EMAIL_VERIFICATION_WAITING
              ]
            }
          </>
        ))
        .with(legacyEmailStatuses, () => <>{userInfos.primary_email_status}</>)
        .exhaustive()}
    </>,
  ];
};

const MatomoInfoRow = (
  matomo: MemberPageProps["matomoInfo"],
  isCurrentUser: boolean,
) => {
  const status = !!matomo ? matomo.status : "unset";
  return [
    <>Compte Matomo</>,
    match(status)
      .with(ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND, () => (
        <Badge key="matomo-status" severity="success" as="span">
          Actif
        </Badge>
      ))
      .with(ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING, () => (
        <Badge key="matomo-status" severity="info" as="span">
          Création en cours
        </Badge>
      ))
      .otherwise(() => (
        <Badge key="matomo-status" as="span">
          Pas de compte
        </Badge>
      )),
    !!matomo ? (
      <Accordion key="matomo-access" label={"Accès Matomo"}>
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
      </Accordion>
    ) : isCurrentUser ? (
      <>
        "Tu n'as pas de compte Matomo. Si tu en as besoin, tu peux{" "}
        <a href="/services/matomo">faire une demande de compte Matomo</a>.
      </>
    ) : (
      <>
        Ce membre n'a pas de compte matomo, un demande peut être faite depuis
        son espace-membre
      </>
    ),
  ];
};

const sentryInfoRow = (sentry: MemberPageProps["sentryInfo"]) => {
  return [
    <>Compte Sentry</>,
    match(sentry && sentry.status)
      .with(ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND, () => (
        <Badge key="sentry-status" severity="success" as="span">
          Actif
        </Badge>
      ))
      .with(ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING, () => (
        <Badge key="sentry-status" severity="info" as="span">
          Creation en cours
        </Badge>
      ))
      .with(ACCOUNT_SERVICE_STATUS.ACCOUNT_INVITATION_SENT, () => (
        <Badge key="sentry-status" severity="info" as="span">
          Invitation envoyée
        </Badge>
      ))
      .otherwise(() => (
        <Badge key="matomo-status" as="span">
          Pas de compte
        </Badge>
      )),
    match([sentry && sentry.status, !!sentry])
      .with([P._, false], () => (
        <>
          "Tu n'as pas de compte Sentry. Si tu en as besoin, tu peux{" "}
          <a href="/services/sentry">faire une demande de compte Sentry</a>.
        </>
      ))
      .with([ACCOUNT_SERVICE_STATUS.ACCOUNT_INVITATION_SENT, P._], () => {
        return <>Une invitation t'a été envoyée par email.</>;
      })
      .with([ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND, true], () => (
        <Accordion key="sentry-info" label={"Accès Sentry"}>
          <Table
            data={sentry!.metadata.teams.map((s) => [
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
        </Accordion>
      ))
      .with([ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING, P._], () => (
        <p>Ton compte va être créé dans quelques instants</p>
      ))
      .otherwise(() => {
        return (
          <p>
            Ton compte ne semble pas dans un état attendu tu peux consulter un
            admin pour qu'il jette un oeil au problème.
          </p>
        );
      }),
  ];
};

export const MemberStatus = ({
  isExpired,
  emailInfos,
  mattermostInfo,
  userInfos,
  matomoInfo,
  sentryInfo,
  isCurrentUser,
}: {
  isExpired: MemberPageProps["isExpired"];
  emailInfos: MemberPageProps["emailInfos"];
  mattermostInfo: MemberPageProps["mattermostInfo"];
  userInfos: MemberPageProps["userInfos"];
  matomoInfo: MemberPageProps["matomoInfo"];
  sentryInfo: MemberPageProps["sentryInfo"];
  isCurrentUser: boolean;
}) => {
  const rows = [
    // Account status
    [
      <>Compte beta</>,
      match(isExpired)
        .with(true, () => (
          <Badge severity="error" as="span">
            Expiré{" "}
          </Badge>
        ))
        .with(false, () => (
          <Badge severity="success" as="span">
            Actif
          </Badge>
        ))
        .exhaustive(),
      match(isExpired)
        .with(true, () => <>Plus de missions en cours.</>)
        .with(false, () => <>Au moins une mission en cours.</>)
        .exhaustive(),
    ],
    userInfos.primary_email?.endsWith("@beta.gouv.fr") &&
      emailInfos &&
      emailStatusRow(emailInfos, userInfos),
    // Mattermost account status
    mattermostInfo && mattermostInfoRow(mattermostInfo),
    // Matomo account status
    MatomoInfoRow(matomoInfo, isCurrentUser),
    // Sentry account status
    sentryInfoRow(sentryInfo),
  ].filter((z) => !!z);

  return (
    <>
      <h2>Accès aux outils</h2>
      <Table
        className="tbl-account-status"
        headers={["Service", "Status", "Infos"]}
        data={rows}
      />
      <Button
        linkProps={{
          href: "/services",
        }}
      >
        Demandes d'accès aux outils
      </Button>
    </>
  );
};

import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import { match, P } from "ts-pattern";

import { MemberPageProps } from "./MemberPage";
import { BadgeEmailPlan } from "../BadgeEmailPlan";
import { EmailStatusCode } from "@/models/member";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";
import Image from "next/image";
import { fr } from "@codegouvfr/react-dsfr";

const legacyEmailStatuses = P.union(
  EmailStatusCode.EMAIL_CREATION_PENDING,
  EmailStatusCode.EMAIL_UNSET,
);

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
      .otherwise(() => <>{userInfos.primary_email_status}</>),
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
        .otherwise(() => (
          <>{userInfos.primary_email_status}</>
        ))}
    </>,
  ];
};

export const MemberStatus = ({
  isExpired,
  emailInfos,
  userInfos,
  matrixId,
  isCurrentUser,
}: {
  isExpired: MemberPageProps["isExpired"];
  emailInfos: MemberPageProps["emailInfos"];
  userInfos: MemberPageProps["userInfos"];
  matrixId: MemberPageProps["matrixId"];
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
    // Matrix account status
    [
      <>Compte Tchap</>,
      matrixId ? (
        <Badge key="matrix-status" severity="success" as="span">
          Actif
        </Badge>
      ) : (
        <Badge key="matrix-status" severity="warning" as="span">
          Non trouvé
        </Badge>
      ),
      <div key="matrix-info">
        {matrixId && (
          <div className={fr.cx("fr-mb-2w")}>
            <a
              href={`https://tchap.gouv.fr/#/user/${matrixId}`}
              target="_blank"
              rel="noreferrer"
            >
              {matrixId}
            </a>
          </div>
        )}
        Rejoindre{" "}
        <a href="https://tchap.gouv.fr/#/room/#betagouvfrgKBP8KrQi4k:agent.dinum.tchap.gouv.fr">
          l'espace Tchap{" "}
          <Image
            width="100"
            height="20"
            className={fr.cx("fr-ml-1w")}
            style={{ verticalAlign: "middle" }}
            alt="beta.gouv.fr Tchap channel icon"
            src="/static/images/espace-tchap-beta.png"
          />
        </a>
      </div>,
    ],
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

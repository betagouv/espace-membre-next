import { EmailStatusCode } from "@/models/member";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { fr, FrCxArg } from "@codegouvfr/react-dsfr/fr";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";
import Table from "@codegouvfr/react-dsfr/Table";

import { MemberPageProps } from "./MemberPage";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";

const EmailLink = ({ email }) => <a href={`mailto:${email}`}>{email}</a>;

export const MemberStatus = ({
    isExpired,
    emailInfos,
    mattermostInfo,
    userInfos,
    redirections,
}: {
    isExpired: MemberPageProps["isExpired"];
    emailInfos: MemberPageProps["emailInfos"];
    mattermostInfo: MemberPageProps["mattermostInfo"];
    userInfos: MemberPageProps["userInfos"];
    redirections: MemberPageProps["redirections"];
}) => {
    // todo: use ts-pattern or equivalent to handle all cases
    const rows = [
        [
            <>
                Compte beta
                <span
                    className={fr.cx(
                        "fr-icon--xs",
                        "fr-icon-info-fill",
                        "fr-ml-1v"
                    )}
                    style={{ cursor: "pointer" }}
                    title={
                        "Indique si ton compte membre beta.gouv.fr est actif"
                    }
                />
            </>,
            !isExpired ? (
                <Badge severity="success">Actif</Badge>
            ) : (
                <Badge severity="error">Expiré</Badge>
            ),
        ],
        (emailInfos && [
            <>
                Statut de l'email <EmailLink email={emailInfos.email} />
            </>,
            <>
                <Badge severity="info" className={fr.cx("fr-mr-1w")}>
                    {/* todo: pkoi 3 flags ? */}
                    {emailInfos.isPro
                        ? "OVH PRO"
                        : emailInfos.isExchange
                        ? "Exchange"
                        : emailInfos.emailPlan ===
                          EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC
                        ? "OVH MX"
                        : "?"}
                </Badge>
                {userInfos.primary_email_status ===
                EmailStatusCode.EMAIL_ACTIVE ? (
                    <Badge severity="success">Actif</Badge>
                ) : (
                    <Badge severity="error">
                        {
                            EMAIL_STATUS_READABLE_FORMAT[
                                userInfos.primary_email_status
                            ]
                        }
                    </Badge>
                )}
            </>,
        ]) ||
            [],
        (emailInfos && [
            <>
                Email <EmailLink email={emailInfos.email} /> classé en spam OVH
            </>,
            !emailInfos.isBlocked ? (
                <Badge severity="success">Pas de spam</Badge>
            ) : (
                <Badge severity="error">SPAM</Badge>
            ),
        ]) ||
            [],

        mattermostInfo && [
            "Compte Mattermost",
            mattermostInfo.hasMattermostAccount &&
            mattermostInfo.mattermostUserName ? (
                <>
                    <Badge severity="info" className={fr.cx("fr-mr-1w")}>
                        {mattermostInfo.mattermostUserName}
                    </Badge>
                    {!mattermostInfo.isInactiveOrNotInTeam ? (
                        <Badge severity="success">Actif</Badge>
                    ) : (
                        <Badge severity="error">Inactif</Badge> // todo
                    )}
                </>
            ) : (
                <Badge severity="error">Compte introuvable</Badge> // todo
            ),
            ,
        ],
        ...redirections.map((r) => [
            <>
                Redirection <EmailLink email={r.from} /> vers{" "}
                <EmailLink email={r.to} />.
            </>,
            <Badge key={r.to} severity="success">
                OK
            </Badge>,
        ]),
    ].filter((z) => !!z);

    return (
        <Table
            className="tbl-account-status"
            fixed
            headers={["Service", "Infos"]}
            data={rows}
        ></Table>
    );
};

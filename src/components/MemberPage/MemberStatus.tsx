import { EmailStatusCode } from "@/models/member";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { fr } from "@codegouvfr/react-dsfr/fr";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";
import Table from "@codegouvfr/react-dsfr/Table";

import { MemberPageProps } from "./MemberPage";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";

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
            "Compte beta",
            !isExpired ? (
                <Badge severity="success">OK</Badge>
            ) : (
                <Badge severity="error">Expiré</Badge>
            ),
        ],
        (emailInfos && [
            `Statut de l'email ${emailInfos.email}`,
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
                    <Badge severity="warning">
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
            `Liste SPAM OVH ${emailInfos.email}`,
            !emailInfos.isBlocked ? (
                <Badge severity="success">ok</Badge>
            ) : (
                <Badge severity="error">BLOQUÉ</Badge>
            ),
        ]) ||
            [],

        mattermostInfo && [
            "Compte mattermost",
            mattermostInfo.hasMattermostAccount &&
            mattermostInfo.mattermostUserName ? (
                <>
                    <Badge severity="success" className={fr.cx("fr-mr-1w")}>
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
            r.from,
            <Badge key={r.to} severity="success">
                {r.to}
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

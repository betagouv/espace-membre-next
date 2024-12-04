import { ReactNode } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Table from "@codegouvfr/react-dsfr/Table";
import { match } from "ts-pattern";

import { MemberPageProps } from "./MemberPage";
import { EmailStatusCode } from "@/models/member";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";

export const MemberContact = ({
    userInfos,
    mattermostInfo,
    emailInfos,
    isAdmin,
    isCurrentUser,
}: {
    userInfos: MemberPageProps["userInfos"];
    mattermostInfo: MemberPageProps["mattermostInfo"];
    emailInfos: MemberPageProps["emailInfos"];
    isAdmin: MemberPageProps["isAdmin"];
    isCurrentUser: MemberPageProps["isCurrentUser"];
}) => {
    const infos: { label: ReactNode; value: ReactNode }[] = [];
    if (userInfos.primary_email) {
        infos.push({
            label: "Email principal",
            value: (
                <>
                    <a href={`mailto:${userInfos.primary_email}`}>
                        {userInfos.primary_email}
                    </a>
                    {emailInfos &&
                        (emailInfos.isPro ? (
                            <Badge
                                small
                                className={fr.cx("fr-ml-1w")}
                                severity="info"
                            >
                                OVH Pro
                            </Badge>
                        ) : emailInfos.isExchange ? (
                            <Badge
                                small
                                className={fr.cx("fr-ml-1w")}
                                severity="info"
                            >
                                OVH Exchange
                            </Badge>
                        ) : emailInfos.emailPlan ===
                          EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC ? (
                            <Badge
                                small
                                className={fr.cx("fr-ml-1w")}
                                severity="info"
                            >
                                OVH MX
                            </Badge>
                        ) : null)}
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
                </>
            ),
        });
    }

    if ((isAdmin || isCurrentUser) && userInfos.secondary_email) {
        infos.push({
            label: (
                <>
                    Email secondaire{" "}
                    <span
                        title="Information privée"
                        className={fr.cx("fr-icon--sm", "fr-icon-lock-line")}
                    />
                </>
            ),
            value: (
                <a href={`mailto:${userInfos.secondary_email}`}>
                    {userInfos.secondary_email}
                </a>
            ),
        });
    }

    if (mattermostInfo.hasMattermostAccount) {
        infos.push({
            label: "Mattermost",
            value: <span>@{mattermostInfo.mattermostUserName}</span>,
        });
    }

    if (userInfos.github) {
        infos.push({
            label: "Compte GitHub",
            value: (
                <a href={`https://github.com/${userInfos.github}`}>
                    @{userInfos.github}
                </a>
            ),
        });
    }

    if (userInfos.link) {
        infos.push({
            label: "URL",
            value: <a href={userInfos.link}>{userInfos.link}</a>,
        });
    }

    return (
        (infos.length && (
            <Table
                className="tbl-contact"
                fixed
                headers={["Titre", "Lien"]}
                data={infos.map((info) => [info.label, info.value])}
            ></Table>
        )) || <>Aucune information de contact trouvée 😰</>
    );
};

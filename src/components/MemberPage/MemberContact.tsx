import { ReactNode } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Table from "@codegouvfr/react-dsfr/Table";
import Link from "next/link";

import { MemberPageProps } from "./MemberPage";
import { BadgeEmailPlan } from "../BadgeEmailPlan";
import { EmailStatusCode } from "@/models/member";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";

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
                    {emailInfos && (
                        <BadgeEmailPlan plan={emailInfos.emailPlan} />
                    )}
                    {userInfos.primary_email_status !==
                        EmailStatusCode.EMAIL_ACTIVE && (
                        <Badge
                            severity="error"
                            small
                            as="span"
                            className={fr.cx("fr-ml-1w")}
                        >
                            {
                                EMAIL_STATUS_READABLE_FORMAT[
                                    userInfos.primary_email_status
                                ]
                            }
                        </Badge>
                    )}
                    {isCurrentUser &&
                        userInfos.primary_email_status ===
                            EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING && (
                            <span>
                                Le mot de passe doit être défini. Rendez vous
                                dans{" "}
                                <a href={"/account?tab=compte-email#password"}>
                                    Changer mon mot de passe
                                </a>
                            </span>
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

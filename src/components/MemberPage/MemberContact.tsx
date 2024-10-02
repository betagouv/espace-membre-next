import { ReactNode } from "react";

import Table from "@codegouvfr/react-dsfr/Table";
import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";

import { MemberPageProps } from "./MemberPage";

export const MemberContact = ({
    userInfos,
    mattermostInfo,
    emailInfos,
    isAdmin,
    canEdit,
}: {
    userInfos: MemberPageProps["userInfos"];
    mattermostInfo: MemberPageProps["mattermostInfo"];
    emailInfos: MemberPageProps["emailInfos"];
    isAdmin: MemberPageProps["isAdmin"];
    canEdit: MemberPageProps["canEdit"];
}) => {
    const infos: { label: string; value: ReactNode }[] = [];
    if (userInfos.primary_email) {
        infos.push({
            label: "Email principal",
            value: (
                <>
                    <a href={`mailto:${userInfos.primary_email}`}>
                        {userInfos.primary_email}
                    </a>
                    {emailInfos && emailInfos.isPro && (
                        <Badge
                            small
                            className={fr.cx("fr-ml-1w")}
                            severity="success"
                        >
                            OVH Pro
                        </Badge>
                    )}
                    {emailInfos && emailInfos.isExchange && (
                        <Badge
                            small
                            className={fr.cx("fr-ml-1w")}
                            severity="success"
                        >
                            OVH Exchange
                        </Badge>
                    )}
                </>
            ),
        });
    }

    if ((isAdmin || canEdit) && userInfos.secondary_email) {
        infos.push({
            label: "Email secondaire",
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
        <Table
            className="tbl-contact"
            fixed
            headers={["Titre", "Lien"]}
            data={infos.map((info) => [info.label, info.value])}
        ></Table>
    );
};

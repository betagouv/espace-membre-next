import Button from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import Link from "next/link";
import { createSerializer } from "nuqs"; // can also be imported from 'nuqs' in client code
import { match, P } from "ts-pattern";

import { MemberPageProps } from "./MemberPage";
import { communityQueryParser } from "../CommunityPage/utils";
import { FichePicture } from "../FichePicture";
import LastChange from "../LastChange";
import { PrivateMemberChangeSchemaType } from "@/models/memberChange";

const getInitials = (fullname: string) => {
    const parts = fullname.split(" ").filter(Boolean);
    return parts.map((p) => p.charAt(0).toUpperCase()).join("");
};

const serialize = createSerializer({
    filters: communityQueryParser,
});

export const MemberCard = ({
    userInfos,
    avatar,
    changes,
    isAdmin,
    isCurrentUser,
    sessionUserIsFromIncubatorTeam,
}: {
    userInfos: MemberPageProps["userInfos"];
    avatar?: string | undefined;
    changes: PrivateMemberChangeSchemaType[];
    isAdmin: boolean;
    isCurrentUser: boolean;
    sessionUserIsFromIncubatorTeam: boolean;
}) => {
    const heading = (
        <>
            Domaine:{" "}
            <Link
                href={`/community/${serialize({
                    filters: [
                        {
                            type: "domaine",
                            value: userInfos.domaine,
                        },
                    ],
                })}`}
                title={`Voir tous les membres de ce domaine`}
            >
                {userInfos.domaine}
            </Link>
            <br />
            {userInfos.teams?.length
                ? userInfos.teams
                      // @ts-ignore todo
                      ?.map((t) => `${t.name} - ${t.incubator_title}`)
                      .join(", ")
                : null}
        </>
    );
    const canEdit = isAdmin || isCurrentUser || sessionUserIsFromIncubatorTeam;
    const linkToEditPage = match([
        isAdmin,
        isCurrentUser,
        sessionUserIsFromIncubatorTeam,
    ])
        .with(
            [true, P._, P._],
            () => `/community/${userInfos.username}/admin-update`
        )
        .with([false, true, P._], () => `/account/base-info`)
        .with(
            [false, false, true],
            () => `/community/${userInfos.username}/update`
        )
        .otherwise(() => "");
    return (
        <div
            className={fr.cx("fr-p-2w", "fr-grid-row")}
            style={{
                backgroundColor: "#F5F5FE",
                display: "flex",
                width: "100%",
            }}
        >
            <div
                style={{ textAlign: "center" }}
                className={fr.cx("fr-mr-4w", "fr-col-2")}
            >
                <FichePicture
                    shape="round"
                    size="small"
                    src={avatar}
                    initials={getInitials(userInfos.fullname)}
                />
                {userInfos.workplace_insee_code ? (
                    <span className={fr.cx("fr-text--light")}>
                        <span
                            className={fr.cx(
                                "ri-map-pin-fill",
                                "fr-icon--xs",
                                "fr-mr-1v"
                            )}
                        />
                        {userInfos.workplace_insee_code}
                    </span>
                ) : null}
                {canEdit && (
                    <Button
                        className=""
                        style={{ marginTop: fr.spacing("2w") }}
                        size="small"
                        linkProps={{
                            href: linkToEditPage,
                        }}
                    >
                        Modifier
                    </Button>
                )}
            </div>
            <div className={fr.cx("fr-col")}>
                <div
                    className={fr.cx("fr-text--light", "fr-text--sm")}
                    style={{ margin: "0 0" }}
                >
                    {heading}
                </div>
                <div
                    className={fr.cx("fr-text--lg", "fr-text--bold")}
                    style={{
                        margin: "0",
                        color: fr.colors.decisions.text.actionHigh.blueFrance
                            .default,
                    }}
                >
                    {userInfos.role}
                </div>
                {(userInfos.competences && userInfos.competences?.length && (
                    <ul style={{ paddingLeft: 0 }}>
                        {userInfos.competences.map((c) => (
                            <li
                                key={c}
                                style={{
                                    display: "inline",
                                }}
                            >
                                <Tag
                                    linkProps={{
                                        href: `/community/${serialize({
                                            filters: [
                                                {
                                                    type: "competence",
                                                    value: c,
                                                },
                                            ],
                                        })}`,
                                    }}
                                    title={`Voir tous les membres avec cette compétence`}
                                    className={fr.cx("fr-mr-1w", "fr-mb-1w")}
                                >
                                    {c}
                                </Tag>
                            </li>
                        ))}
                    </ul>
                )) ||
                    null}

                <LastChange
                    changes={changes}
                    style={{
                        textAlign: "right",
                        marginBottom: fr.spacing("1v"),
                        marginTop: fr.spacing("4w"),
                    }}
                />
            </div>
        </div>
    );
};

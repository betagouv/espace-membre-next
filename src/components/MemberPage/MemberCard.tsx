import { fr } from "@codegouvfr/react-dsfr/fr";
import Tag from "@codegouvfr/react-dsfr/Tag";

import { PrivateMemberChangeSchemaType } from "@/models/memberChange";
import { FichePicture } from "../FichePicture";
import LastChange from "../LastChange";
import { MemberPageProps } from "./MemberPage";
import Button from "@codegouvfr/react-dsfr/Button";

const getInitials = (fullname: string) => {
    const parts = fullname.split(" ").filter(Boolean);
    return parts.map((p) => p.charAt(0).toUpperCase()).join("");
};

// first tab
export const MemberCard = ({
    userInfos,
    avatar,
    changes,
    isAdmin,
    canEdit,
}: {
    userInfos: MemberPageProps["userInfos"];
    avatar?: string | undefined;
    changes: PrivateMemberChangeSchemaType[];
    isAdmin: boolean;
    canEdit: boolean;
}) => {
    console.log(userInfos);
    const heading = `${userInfos.domaine} ${
        userInfos.teams?.length
            ? userInfos.teams
                  // @ts-ignore TODO: TS
                  ?.map((t) => `${t.name} - ${t.incubator_title}`)
                  .join(", ")
            : ""
    }`;

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
                {(isAdmin || canEdit) && (
                    <Button
                        className=""
                        style={{ marginTop: fr.spacing("2w") }}
                        size="small"
                        linkProps={{
                            href: isAdmin ? `/community/${userInfos.username}/admin-update` : `/account/base-info`,
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
                                <Tag className={fr.cx("fr-mr-1w", "fr-mb-1w")}>
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

"use client";
import React, { useCallback, useMemo, useState } from "react";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { fr } from "@codegouvfr/react-dsfr/fr";
import { CommunityProps } from ".";
import AutoComplete from "../AutoComplete";
import Table from "@codegouvfr/react-dsfr/Table";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import Link from "next/link";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { exportToCsv } from "./exportToCsv";
import Button from "@codegouvfr/react-dsfr/Button";
import Tile from "@codegouvfr/react-dsfr/Tile";
import { linkRegistry } from "@/utils/routes/registry";
import notification from "@gouvfr/dsfr/dist/artwork/pictograms/digital/mail-send.svg";
import map from "@gouvfr/dsfr/dist/artwork/pictograms/map/map.svg";
import dataviz from "@gouvfr/dsfr/dist/artwork/pictograms/digital/data-visualization.svg";
import { StaticImageData } from "next/image";

// return if user is still active at community level
const isActive = (missions: CommunityProps["users"][number]["missions"]) => {
    return missions.filter((m) => !m.end || m.end > new Date()).length > 0;
};

// return table row for a given user
const getUserRow = ({
    user,
    startupOptions,
    incubatorOptions,
    onDomaineClick,
}: {
    user: CommunityProps["users"][number];
    startupOptions: CommunityProps["startupOptions"];
    incubatorOptions: CommunityProps["incubatorOptions"];
    onDomaineClick: (domaine: string) => void;
}) => {
    const startups = getStartupsFromMissions(user.missions, startupOptions);
    const active = isActive(user.missions);

    const teams: ReturnType<typeof getStartupsFromMissions> & { url?: string } =
        [
            ...(startups || []),
            ...(user.teams?.map((t) => {
                const incub = incubatorOptions.find(
                    (i) => i.value === t.incubator_id
                );
                return {
                    label: `${t.name}${incub ? ` - ${incub.label}` : ""}`,
                    value: t.uuid,
                    url: linkRegistry.get("incubatorDetails", {
                        incubatorId: incub?.value,
                    }),
                };
            }) || []),
        ];
    return [
        // user
        <>
            {!active && (
                <i
                    className={fr.cx(
                        "fr-icon-close-circle-line",
                        "fr-icon--sm",
                        "fr-mr-1w"
                    )}
                    title="Compte suspendu"
                ></i>
            )}
            <Link
                className={fr.cx({
                    "fr-text--light": !active,
                })}
                title="Accéder à la fiche du membre"
                href={`/community/${user.username}`}
            >
                {user.fullname}
            </Link>
        </>,
        // domaine
        <span
            key="domaine"
            className={fr.cx("fr-link", "fr-link--sm")}
            style={{ cursor: "pointer" }}
            title="Chercher tous les membres de ce domaine"
            onClick={() => {
                onDomaineClick(user.domaine);
            }}
        >
            {user.domaine}
        </span>,
        // teams
        teams.length ? (
            <ul style={{ paddingLeft: 0 }}>
                {teams.map(
                    (s) =>
                        s && (
                            <li
                                key={s.value}
                                style={{
                                    display: "inline",
                                }}
                            >
                                <Tag
                                    linkProps={{
                                        href:
                                            // @ts-ignore todo
                                            (s && s.url) ||
                                            `/startups/${s?.value}`,
                                    }}
                                    title="Accéder à la fiche"
                                    className={fr.cx("fr-mr-1w", "fr-mb-1w")}
                                >
                                    {s?.label}
                                </Tag>
                            </li>
                        )
                )}
            </ul>
        ) : null,
    ];
};

// list unique active startups from someone missions
const getStartupsFromMissions = (
    missions: CommunityProps["users"][number]["missions"],
    startupOptions: CommunityProps["startupOptions"]
) => {
    return (
        missions
            // only use active missions
            .filter((m) => !m.end || new Date(m.end) > new Date())
            // only missions with startups
            .filter((m) => m.startups && m.startups.length > 0)
            // extract startups data
            .flatMap(
                (m) =>
                    m.startups
                        ?.map((s) => {
                            // get full startup info
                            return startupOptions.find((s2) => s2.value === s);
                        })
                        .filter(Boolean) || []
            )
            // uniquify
            .filter(
                (s, i, a) =>
                    !a.slice(i + 1).find((t) => t?.value === (s && s.value))
            )
    );
};

/* Pure component */
export const Community = (props: CommunityProps) => {
    const [filters, setFilters] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    // autocomplete groups
    const searchOptions = useMemo(
        () => [
            // todo: remove old members
            ...props.users.map((u) => ({
                type: "user",
                group: "Membres",
                id: u.uuid,
                label: u.fullname,
            })),
            ...props.domaineOptions.map((d) => ({
                type: "domaine",
                group: "Domaines",
                id: d.value,
                label: d.label,
            })),
            ...props.competenceOptions.map((d) => ({
                type: "competence",
                group: "Compétences",
                id: d.value,
                label: d.label,
            })),
            ...props.incubatorOptions.map((i) => ({
                type: "incubator",
                group: "Incubateur",
                id: i.value,
                label: i.label,
            })),
            // todo: remove old startups
            ...props.startupOptions.map((s) => ({
                type: "startup",
                group: "Startup",
                id: s.value,
                label: s.label,
            })),
        ],
        [props.startupOptions, props.users]
    );

    const filterResult = useCallback(
        (result: CommunityProps["users"][number]) => {
            if (!filters.length) return true;

            return (
                filters.filter((filter) => {
                    if (filter.type === "user") {
                        return filter.id === result.uuid;
                    } else if (filter.type === "competence") {
                        const user = props.users.find(
                            (u) => u.uuid === result.uuid
                        );
                        return user && user.competences?.includes(filter.id);
                    } else if (filter.type === "domaine") {
                        const user = props.users.find(
                            (u) => u.uuid === result.uuid
                        );
                        return user && user.domaine === filter.label;
                    } else if (filter.type === "incubator") {
                        const incubator = props.incubatorMembers.find(
                            (i) => i.id === filter.id
                        );
                        return (
                            incubator &&
                            incubator.members
                                .map((m) => m.uuid)
                                .includes(result.uuid)
                        );
                    } else if (filter.type === "active_only") {
                        if (filter.value === false) return true;
                        const active = isActive(result.missions);
                        return active;
                    } else if (filter.type === "startup") {
                        const user = props.users.find(
                            (u) => u.uuid === result.uuid
                        );
                        return (
                            user &&
                            user.missions
                                .flatMap((m) => m.startups)
                                .includes(filter.id)
                        );
                    }
                }).length === filters.length // or > 0 for or query
            );
        },
        [filters]
    );

    const results = useMemo(
        () =>
            (filters.length &&
                props.users
                    .filter(filterResult)
                    .sort((a, b) => a.fullname.localeCompare(b.fullname))) ||
            [],
        [filters]
    );

    const onDownloadClick = async () => {
        exportToCsv("users.csv", results);
    };

    const onDomaineClick = (domaine: string) => {
        setFilters((filters) =>
            [
                {
                    type: "active_only",
                    value: !!filters.find(
                        (f) => f.type === "active_only" && !!f.value
                    ),
                },
                {
                    type: "domaine",
                    label: domaine,
                },
            ].filter(Boolean)
        );
        setCurrentPage(1);
    };

    const pageSize = 25;
    const pageCount = Math.ceil(results.length / pageSize);

    return (
        <>
            <h1>Membres de la communauté</h1>
            <AutoComplete
                multiple={true}
                options={searchOptions}
                onSelect={(newFilters) => {
                    setFilters((filters) => [
                        ...newFilters,
                        // keep existing active_only flag
                        {
                            type: "active_only",
                            value: !!filters.find(
                                (f) => f.type === "active_only" && f.value
                            ),
                        },
                    ]);
                    setCurrentPage(1);
                }}
                defaultValue={filters.filter((f) => f.type !== "active_only")}
                value={filters.filter((f) => f.type !== "active_only")}
                getOptionKey={(option) =>
                    typeof option === "string"
                        ? option
                        : option.group + option.id
                }
                optionKeyField={"id"}
                optionLabelField={"label"}
                groupBy={(o) => o.group}
                placeholder={
                    "Choisissez un membre et/ou un domaine, une compétence, une startup, un incubateur"
                }
            />
            <br />
            <Checkbox
                options={[
                    {
                        label: "Membres actifs uniquement",
                        nativeInputProps: {
                            onClick: (e) => {
                                const checked = e.currentTarget.checked;
                                setFilters((filters) => [
                                    ...filters.filter(
                                        (f) => f.type !== "active_only"
                                    ),
                                    { type: "active_only", value: checked },
                                ]);
                                setCurrentPage(1);
                            },
                        },
                    },
                ]}
            />

            {results.length ? (
                <>
                    <Table
                        fixed
                        caption={
                            <>
                                {results.length} résultat
                                {results.length > 1 ? "s" : ""}
                                <Button
                                    size="small"
                                    priority="secondary"
                                    className={fr.cx("fr-ml-1w")}
                                    iconId="fr-icon-download-line"
                                    onClick={onDownloadClick}
                                >
                                    Télécharger
                                </Button>
                            </>
                        }
                        headers={["Nom", "Domaine", "Équipe(s)"]}
                        data={results
                            .slice(
                                (currentPage - 1) * pageSize,
                                (currentPage - 1) * pageSize + pageSize
                            )
                            .map((r) =>
                                getUserRow({
                                    user: r,
                                    startupOptions: props.startupOptions,
                                    incubatorOptions: props.incubatorOptions,
                                    onDomaineClick: onDomaineClick,
                                })
                            )}
                    />
                    <Pagination
                        showFirstLast={false}
                        count={pageCount}
                        defaultPage={currentPage}
                        getPageLinkProps={(number) => ({
                            href: "#",
                            onClick: (e) => {
                                setCurrentPage(number);
                            },
                        })}
                    />
                </>
            ) : filters.length ? (
                "Aucun résultat"
            ) : null}
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <Footer />
        </>
    );
};

const Footer = () => (
    <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
            <Tile
                className={fr.cx("fr-tile--sm")}
                title="Carte de la communauté"
                desc="Voir la carte des membres"
                orientation="horizontal"
                imageUrl={(map as StaticImageData).src}
                linkProps={{
                    href: linkRegistry.get("map"),
                }}
            />
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
            <Tile
                className={fr.cx("fr-tile--sm")}
                title="Observatoire de la communauté"
                desc="Consulter les stats"
                orientation="horizontal"
                imageUrl={(dataviz as StaticImageData).src}
                linkProps={{
                    href: linkRegistry.get("metabase"),
                }}
            />
        </div>
    </div>
);

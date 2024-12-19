"use client";
import React, { useCallback, useMemo, useState } from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { fr } from "@codegouvfr/react-dsfr/fr";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import Table from "@codegouvfr/react-dsfr/Table";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import Tag from "@codegouvfr/react-dsfr/Tag";
import Link from "next/link";
import { useQueryState } from "nuqs";

import { CommunityProps } from ".";
import { exportToCsv } from "./exportToCsv";
import { Footer } from "./Footer";
import {
    getStartupsFromMissions,
    communityQueryParser,
    type CommunityFilterSchemaType,
} from "./utils";
import AutoComplete from "../AutoComplete";
import { Map } from "../Map";
import { isUserActive } from '@/utils/member';
import { linkRegistry } from "@/utils/routes/registry";

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
    const active = isUserActive(user.missions);

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
            <Link
                className={fr.cx({
                    "fr-text--light": !active,
                })}
                title="Accéder à la fiche du membre"
                href={`/community/${user.username}`}
            >
                {/* sometimes we do not have user fullname */}
                {user.fullname || user.username}
            </Link>
        </>,
        <>{user.primary_email}</>,
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
                {teams
                    .filter((s) => !!s)
                    .map((s) => (
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
                                        (s && s.url) || `/startups/${s?.value}`,
                                }}
                                title="Accéder à la fiche"
                                className={fr.cx("fr-mr-1w", "fr-mb-1w")}
                            >
                                {s.label}
                            </Tag>
                        </li>
                    ))}
            </ul>
        ) : null,
    ];
};

/* Pure component */
export const Community = (props: CommunityProps) => {
    const [currentPage, setCurrentPage] = useState(1);

    const [filters, setFilters] = useQueryState(
        "filters",
        communityQueryParser
    );

    // autocomplete groups
    const searchOptions = useMemo(
        () => [
            // todo: remove old members
            ...props.users.map((u) => ({
                type: "user" as CommunityFilterSchemaType["type"],
                group: "Membres",
                id: u.uuid,
                label: u.fullname,
            })),
            ...props.domaineOptions.map((d) => ({
                type: "domaine" as CommunityFilterSchemaType["type"],
                group: "Domaines",
                id: d.label,
                label: d.label,
            })),
            ...props.competenceOptions.map((d) => ({
                type: "competence" as CommunityFilterSchemaType["type"],
                group: "Compétences",
                id: d.value,
                label: d.label,
            })),
            ...props.incubatorOptions.map((i) => ({
                type: "incubator" as CommunityFilterSchemaType["type"],
                group: "Incubateur",
                id: i.value,
                label: i.label,
            })),
            // todo: remove old startups
            ...props.startupOptions.map((s) => ({
                type: "startup" as CommunityFilterSchemaType["type"],
                group: "Startup",
                id: s.value,
                label: s.label,
            })),
        ],
        [props.startupOptions, props.users]
    );

    const getColumnData = (name) =>
        results.map((r) => r.primary_email).join("\n");

    const filterResult = useCallback(
        (result: CommunityProps["users"][number]) => {
            if (!filters.length) return true;
            return (
                filters.filter((filter) => {
                    if (!filter) {
                        return true;
                    } else if (filter.type === "active_only") {
                        if (filter.value === false) return true;
                        // test if user has active missions
                        return isUserActive(result.missions);
                    } else if (filter.type === "user") {
                        // test specific user uuid
                        return filter.value === result.uuid;
                    } else if (filter.type === "competence" && filter.value) {
                        // test if user has the given competence
                        const user = props.users.find(
                            (u) => u.uuid === result.uuid
                        );
                        return (
                            user &&
                            user.competences?.includes(filter.value.toString())
                        );
                    } else if (filter.type === "domaine") {
                        // test if user has the given domain
                        const user = props.users.find(
                            (u) => u.uuid === result.uuid
                        );
                        return user && user.domaine === filter.value;
                    } else if (filter.type === "incubator") {
                        // test if user belongs to given incubator
                        const incubator = props.incubatorMembers.find(
                            (i) => i.uuid === filter.value
                        );
                        return (
                            incubator &&
                            incubator.members
                                .map((m) => m.uuid)
                                .includes(result.uuid)
                        );
                    } else if (filter.type === "startup" && filter.value) {
                        // test if user had a mission in given startup
                        // todo: when active_only, only show startup active members
                        const user = props.users.find(
                            (u) => u.uuid === result.uuid
                        );
                        return (
                            user &&
                            user.missions
                                .flatMap((m) => m.startups)
                                .includes(filter.value.toString())
                        );
                    }
                }).length === filters.length // or > 0 for or query
            );
        },
        [filters]
    );

    const results = useMemo(
        () =>
            props.users
                .filter(filterResult)
                .sort((a, b) => a.fullname.localeCompare(b.fullname)) || [],
        [filters]
    );

    const onDownloadClick = async () => {
        exportToCsv("users.csv", results);
    };

    const onDomaineClick = (domaine: string) => {
        setFilters((filters) => [
            {
                type: "active_only",
                value: !!filters.find(
                    (f) => f.type === "active_only" && !!f.value
                ),
            },
            {
                type: "domaine",
                value: domaine,
            },
        ]);
        setCurrentPage(1);
    };

    const pageSize = 25;
    const pageCount = Math.ceil(results.length / pageSize);
    const headers = ["Nom", "Email", "Domaine", "Équipe(s)"];

    const defaultFilterValue = searchOptions
        .filter((o) => o.type !== "active_only")
        .filter((o) =>
            filters.find(
                (f) =>
                    f.type === o.type &&
                    (o.label === f.value || o.id === f.value)
            )
        );

    const points = useMemo(
        () =>
            results
                .filter((r) => !!r.workplace_insee_code)
                .map((r) => {
                    const latLon = r.latLon;
                    if (latLon) {
                        return {
                            geoLoc: latLon,
                            label: r.fullname,
                            content: `
                                <div class="fr-mb-2w">
                                    <b>${r.domaine}</b>
                                    <br />
                                    ${r.role}
                                </div>`,
                            href: `/community/${r.username}`,
                        };
                    }
                })
                .filter((p) => p && p.geoLoc?.lat && p.geoLoc?.lon)
                .filter((x) => !!x),
        [results]
    );

    return (
        <>
            <div className={`${fr.cx("fr-grid-row")}`}>
                <div
                    className={`${fr.cx(
                        "fr-col-12",
                        "fr-col-sm-6",
                        "fr-col-md-6",
                        "fr-col-lg-6"
                    )}`}
                >
                    <h1>Membres de la communauté</h1>
                </div>
                <div
                    className={`${fr.cx(
                        "fr-col-12",
                        "fr-col-sm-6",
                        "fr-col-md-6",
                        "fr-col-lg-6"
                    )}`}
                    style={{ textAlign: "right" }}
                >
                    <Button
                        linkProps={{
                            href: "/community/create",
                        }}
                        priority="secondary"
                    >
                        Créer un membre
                    </Button>
                </div>
            </div>
            <p>
                Vous pouvez chercher des membres par nom, domaine, compétence,
                produit ou incubateur.
            </p>
            <AutoComplete
                multiple={true}
                options={searchOptions}
                onSelect={(newFilters) => {
                    setFilters((filters) => [
                        ...newFilters.map((f) => ({
                            type: f.type,
                            value: f.id || f.label,
                        })),
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
                defaultValue={defaultFilterValue}
                value={defaultFilterValue}
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
                            checked: !!filters.find(
                                (f) => f.type === "active_only" && !!f.value
                            ),
                            onChange: (e) => {
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
                    <h2>
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
                    </h2>

                    <Tabs
                        tabs={[
                            {
                                label: "Tableau",
                                content: (
                                    <>
                                        <Table
                                            fixed
                                            noCaption
                                            headers={headers.map(
                                                (header, index) => (
                                                    <div key={header}>
                                                        {header}
                                                        {header === "Email" && (
                                                            <Button
                                                                size="small"
                                                                priority="tertiary no outline"
                                                                iconId="fr-icon-clipboard-line"
                                                                title={`Copier les ${results.length} adresses emails`}
                                                                onClick={() =>
                                                                    copyToClipboard(
                                                                        getColumnData(
                                                                            header
                                                                        )
                                                                    )
                                                                }
                                                            >
                                                                copier
                                                            </Button>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                            data={results
                                                .slice(
                                                    (currentPage - 1) *
                                                        pageSize,
                                                    (currentPage - 1) *
                                                        pageSize +
                                                        pageSize
                                                )
                                                .map((r) =>
                                                    getUserRow({
                                                        user: r,
                                                        startupOptions:
                                                            props.startupOptions,
                                                        incubatorOptions:
                                                            props.incubatorOptions,
                                                        onDomaineClick:
                                                            onDomaineClick,
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
                                ),
                            },
                            {
                                label: "Carte",
                                // @ts-ignore todo
                                content: <Map points={points} />,
                            },
                        ]}
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

// Utility function to copy to clipboard
export const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
        () => {
            alert("Les emails ont été copiés dans le presse-papier");
        },
        (err) => {
            console.error("Impossible de copier le texte: ", err);
        }
    );
};

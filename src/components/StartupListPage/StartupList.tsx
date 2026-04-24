"use client";
import React, { startTransition, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { fr } from "@codegouvfr/react-dsfr";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import Table from "@codegouvfr/react-dsfr/Table";

import { PHASE_READABLE_NAME } from "@/models/startup";
import { getAllIncubators } from "@/lib/kysely/queries/incubators";
import { getAllStartupsWithIncubatorAndPhase } from "@/lib/kysely/queries/startups";
import { BadgePhase } from "../StartupPage/BadgePhase";
import AutoComplete from "../AutoComplete";

import { startupsQueryParser } from "./utils";

export interface StartupListProps {
  startups: Awaited<ReturnType<typeof getAllStartupsWithIncubatorAndPhase>>;
  incubators: Awaited<ReturnType<typeof getAllIncubators>>;
}

const getStartupRow = ({
  startup,
  onThematiqueClick,
  onUserTypeClick,
  onIncubatorClick,
}: {
  startup: StartupListProps["startups"][number];
  onThematiqueClick: (thematique: string) => void;
  onUserTypeClick: (usertype: string) => void;
  onIncubatorClick: (incubator: string) => void;
}) => {
  return [
    // user
    <>
      <div className={fr.cx("fr-mb-1w")}>
        <Link
          title="Accéder à la fiche startup"
          href={`/startups/${startup.uuid}`}
          className={fr.cx("fr-link--lg")}
        >
          {/* sometimes we do not have user fullname */}
          {startup.name}
        </Link>
      </div>
      {startup.pitch}
      <br />
      {startup.phase && (
        <BadgePhase phase={startup.phase} className={fr.cx("fr-mt-1w")} />
      )}
    </>,
    // thématiques
    <>
      {((startup.thematiques || []).length && (
        <div className={fr.cx("fr-mb-1w")}>
          <i
            title="Thèmes"
            className={fr.cx("fr-icon--sm", "fr-icon-file-line", "fr-mr-1w")}
          ></i>
          {startup.thematiques.map((thematique, idx, all) => (
            <span key={thematique}>
              <span
                style={{ cursor: "pointer" }}
                className={fr.cx("fr-link", "fr-link")}
                title="Chercher toutes les startups de cette thématique"
                onClick={() => {
                  onThematiqueClick(thematique);
                }}
              >
                {thematique}
              </span>
              {idx < all.length - 1 && ", "}
            </span>
          ))}
        </div>
      )) ||
        null}
      {((startup.usertypes || []).length && (
        <div className={fr.cx("fr-mb-1w")}>
          <i
            title="Utilisateurs"
            className={fr.cx("fr-icon--sm", "fr-icon-group-line", "fr-mr-1w")}
          ></i>
          {startup.usertypes.map((usertype, idx, all) => (
            <span key={usertype}>
              <span
                style={{ cursor: "pointer" }}
                className={fr.cx("fr-link", "fr-link")}
                title="Chercher toutes les startups pour ces utilisateurs"
                onClick={() => {
                  onUserTypeClick(usertype);
                }}
              >
                {usertype}
              </span>
              {idx < all.length - 1 && ", "}
            </span>
          )) || null}
        </div>
      )) ||
        null}
    </>,
    startup.incubatorId && (
      <span
        style={{ cursor: "pointer" }}
        className={fr.cx("fr-link", "fr-link")}
        title="Chercher toutes les startups de cet incubateur"
        onClick={() => {
          onIncubatorClick(startup.incubatorId || "");
        }}
      >
        {startup.incubatorName}
      </span>
    ),
  ];
};

/* Pure component */
export const StartupList = ({ startups, incubators }: StartupListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useQueryState("filters", startupsQueryParser);

  const filterResult = useCallback(
    (result: StartupListProps["startups"][number]) => {
      if (!filters.length) return true;
      return (
        filters.filter((filter) => {
          if (!filter) {
            return true;
          } else if (filter.type === "startup") {
            return filter.value === result.uuid;
          } else if (filter.type === "phase") {
            return filter.value === result.phase;
          } else if (filter.type === "thematique" && filter.value) {
            return (result.thematiques || []).includes(filter.value.toString());
          } else if (filter.type === "usertype" && filter.value) {
            return (result.usertypes || []).includes(filter.value.toString());
          } else if (filter.type === "incubator" && filter.value) {
            return result.incubatorId === filter.value.toString();
          } else if (filter.type === "techno" && filter.value) {
            return (result.techno || []).includes(filter.value.toString());
          }
        }).length === filters.length // or > 0 for or query
      );
    },
    [filters],
  );

  const results = useMemo(
    () =>
      startups
        .filter(filterResult)
        .sort((a, b) => a.name.localeCompare(b.name)) || [],
    [filters],
  );

  const onSelect = async (newFilters) => {
    await setFilters((filters) => [
      ...newFilters.map((f) => ({
        type: f.type,
        value: f.id || f.label,
      })),
    ]);
    await setCurrentPage(1);
  };

  const allThematiques = Array.from(
    new Set(startups.flatMap((s) => s.thematiques || [])),
  )
    .filter(Boolean)
    .sort()
    .map((t) => ({ id: t, label: t }));

  const allUserTypes = Array.from(
    new Set(startups.flatMap((s) => s.usertypes || [])),
  )
    .filter(Boolean)
    .sort()
    .map((t) => ({ id: t, label: t }));

  const allTechnos = Array.from(
    new Set(startups.flatMap((s) => s.techno || [])),
  )
    .filter(Boolean)
    .sort()
    .map((t) => ({ id: t, label: t }));

  const searchOptions = useMemo(
    () => [
      ...Object.entries(PHASE_READABLE_NAME).map(([id, label]) => ({
        type: "phase",
        group: "Phase",
        id,
        label,
      })),
      ...incubators.map((s) => ({
        type: "incubator",
        group: "Incubateur",
        id: s.uuid,
        label: s.title,
      })),
      ...startups.map((s) => ({
        type: "startup",
        group: "Startups",
        id: s.uuid,
        label: s.name,
      })),
      ...allThematiques.map((s) => ({
        type: "thematique",
        group: "Thématiques",
        id: s.id,
        label: s.label,
      })),
      ...allUserTypes.map((s) => ({
        type: "usertype",
        group: "Utilisateurs",
        id: s.id,
        label: s.label,
      })),
      ...allTechnos.map((s) => ({
        type: "techno",
        group: "Technologies",
        id: s.id,
        label: s.label,
      })),
    ],
    [],
  );

  const defaultFilterValue = searchOptions
    //.filter((o) => o.type !== "active_only")
    .filter((o) =>
      filters.find(
        (f) => f.type === o.type && (o.label === f.value || o.id === f.value),
      ),
    );

  const onThematiqueClick = (thematique: string) => {
    setFilters((filters) => [
      {
        type: "thematique",
        value: thematique,
      },
    ]);
    setCurrentPage(1);
  };

  const onUserTypeClick = (usertype: string) => {
    setFilters((filters) => [
      {
        type: "usertype",
        value: usertype,
      },
    ]);
    setCurrentPage(1);
  };

  const onIncubatorClick = (incubator: string) => {
    setFilters((filters) => [
      {
        type: "incubator",
        value: incubator,
      },
    ]);
    setCurrentPage(1);
  };

  const pageSize = 15;
  const pageCount = Math.ceil(results.length / pageSize);
  const headers = ["Nom", "À propos", "Incubateur"];

  return (
    <>
      <AutoComplete
        id="search-startup"
        multiple={true}
        options={searchOptions}
        onSelect={(newFilters) => {
          startTransition(async () => {
            await onSelect(newFilters);
          });
        }}
        defaultValue={defaultFilterValue}
        value={defaultFilterValue}
        getOptionKey={(option) =>
          typeof option === "string" ? option : option.group + option.id
        }
        optionKeyField={"id"}
        optionLabelField={"label"}
        groupBy={(o) => o.group}
        placeholder={
          "Choisissez une startup, thématique, incubateur, technologie, phase"
        }
      />

      {results.length ? (
        <>
          <Table
            fixed
            noCaption
            headers={headers.map((header, index) => (
              <div key={header}>{header}</div>
            ))}
            data={results
              .slice(
                (currentPage - 1) * pageSize,
                (currentPage - 1) * pageSize + pageSize,
              )
              .map((r) =>
                getStartupRow({
                  startup: r,
                  onThematiqueClick: onThematiqueClick,
                  onUserTypeClick: onUserTypeClick,
                  onIncubatorClick: onIncubatorClick,
                }),
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
        <div className={fr.cx("fr-mt-4w")}>Aucun résultat</div>
      ) : null}
    </>
  );
};

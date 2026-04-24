"use client";
import React, { startTransition, useCallback, useMemo, useState } from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";

import SESelect, { StartupType } from "@/components/SESelect";
import AutoComplete from "../AutoComplete";
import {
  getAllStartups,
  getAllStartupsWithIncubator,
  getStartup,
} from "@/lib/kysely/queries";
import { useQueryState } from "nuqs";
import { startupsQueryParser } from "./utils";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import Table from "@codegouvfr/react-dsfr/Table";
import { copyToClipboard } from "@/utils/copyToClipBoard";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import { getAllIncubators } from "@/lib/kysely/queries/incubators";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { incubator } from "@/scripts/github-schemas";

export interface StartupListProps {
  startups: Awaited<ReturnType<typeof getAllStartupsWithIncubator>>;
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
  // const startups = getStartupsFromMissions(user.missions, startupOptions);
  //isUserActive(user.missions);

  // const teams: ReturnType<typeof getStartupsFromMissions> & { url?: string } = [
  //   ...(startups || []),
  //   ...(user.teams?.map((t) => {
  //     const incub = incubatorOptions.find((i) => i.value === t.incubator_id);
  //     return {
  //       label: `${t.name}${incub ? ` - ${incub.label}` : ""}`,
  //       value: t.uuid,
  //       url: incub?.value
  //         ? linkRegistry.get("incubatorDetails", {
  //             incubatorId: incub?.value,
  //           })
  //         : "",
  //     };
  //   }) || []),
  // ];
  return [
    // user
    <>
      <Link
        title="Accéder à la fiche startup"
        href={`/startups/${startup.uuid}`}
        className={fr.cx("fr-link--lg")}
      >
        {/* sometimes we do not have user fullname */}
        {startup.name}
      </Link>
      <br />
      {startup.pitch}
    </>,
    // thématiques
    <>
      {((startup.thematiques || []).length && (
        <div className={fr.cx("fr-mb-1w")}>
          <i
            title="Thèmes"
            className={fr.cx(
              "fr-icon--sm",
              "fr-icon-git-repository-line",
              "fr-mr-1w",
            )}
          ></i>
          {startup.thematiques.map((thematique, idx, all) => (
            <>
              <span
                key={thematique}
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
            </>
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
            <>
              <span
                key={usertype}
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
            </>
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
    // teams
    // teams.length ? (
    //   <ul style={{ paddingLeft: 0 }}>
    //     {teams
    //       .filter((s) => !!s)
    //       .map((s) => (
    //         <li
    //           key={s.value}
    //           style={{
    //             display: "inline",
    //           }}
    //         >
    //           <Tag
    //             linkProps={{
    //               href:
    //                 // @ts-ignore todo
    //                 (s && s.url) || `/startups/${s?.value}`,
    //             }}
    //             title="Accéder à la fiche"
    //             className={fr.cx("fr-mr-1w", "fr-mb-1w")}
    //           >
    //             {s.label}
    //           </Tag>
    //         </li>
    //       ))}
    //   </ul>
    // ) : null,
  ];
};

/* Pure component */
export const StartupList = ({ startups, incubators }: StartupListProps) => {
  const [startup, setStartup] = React.useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useQueryState("filters", startupsQueryParser);

  const router = useRouter();

  const filterResult = useCallback(
    (result: StartupListProps["startups"][number]) => {
      if (!filters.length) return true;
      return (
        filters.filter((filter) => {
          if (!filter) {
            return true;
            // } else if (filter.type === "active_only") {
            //   if (filter.value === false) return true;
            //   // test if user has active missions
            //   return isUserActive(result.missions);
          } else if (filter.type === "startup") {
            // test specific user uuid
            //console.log("startup", startup, filter);
            return filter.value === result.uuid;
          } else if (filter.type === "thematique" && filter.value) {
            return (result.thematiques || []).includes(filter.value.toString());
          } else if (filter.type === "usertype" && filter.value) {
            return (result.usertypes || []).includes(filter.value.toString());
          } else if (filter.type === "incubator" && filter.value) {
            return result.incubatorId === filter.value.toString();
            // } else if (filter.type === "domaine") {
            //   // test if user has the given domain
            //   const user = props.users.find((u) => u.uuid === result.uuid);
            //   return user && user.domaine === filter.value;
            // } else if (filter.type === "primary_email_status") {
            //   // test if user has the given domain
            //   const user = props.users.find((u) => u.uuid === result.uuid);
            //   return user && user.primary_email_status === filter.value;
            // } else if (filter.type === "incubator") {
            // test if user belongs to given incubator
            // const incubator = props.incubatorMembers.find(
            //   (i) => i.uuid === filter.value,
            // );
            // return (
            //   incubator &&
            //   incubator.members.map((m) => m.uuid).includes(result.uuid)
            // );
            // } else if (filter.type === "startup" && filter.value) {
            //   // test if user had a mission in given startup
            //   const user = props.users.find((u) => u.uuid === result.uuid);
            //   const activeOnly = filters.find(
            //     (f) => f.type == "active_only" && !!f.value,
            //   );
            //   return (
            //     user &&
            //     user.missions
            //       .filter((m) =>
            //         activeOnly ? !m.end || m.end > new Date() : true,
            //       )
            //       .flatMap((m) => m.startups)
            //       .includes(filter.value.toString())
            //   );
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

  console.log({ startups, results, filters });

  // const save = (event: { preventDefault: () => void }) => {
  //   event.preventDefault();
  //   router.push(`/startups/${startup}`);
  // };

  const onSelect = async (newFilters) => {
    await setFilters((filters) => [
      ...newFilters.map((f) => ({
        type: f.type,
        value: f.id || f.label,
      })),
      // keep existing active_only flag
      // {
      //   type: "active_only",
      //   value: !!filters.find((f) => f.type === "active_only" && f.value),
      // },
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

  const searchOptions = useMemo(
    () => [
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
      ...incubators.map((s) => ({
        type: "incubator",
        group: "Incubateur",
        id: s.uuid,
        label: s.title,
      })),
      ...allUserTypes.map((s) => ({
        type: "usertype",
        group: "Utilisateurs",
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
  const headers = ["Nom", "Description", "Incubateur"];

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
          "Choisissez une startup, une thématique, incubateur, technologie"
        }
      />

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
  );
};

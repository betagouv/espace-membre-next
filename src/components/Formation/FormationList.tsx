"use client";
import { useState, useEffect, useCallback, useRef } from "react";

import Tag from "@codegouvfr/react-dsfr/Tag";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import FormationCard from "./FormationCard";
import { Formation, FormationInscription } from "@/models/formation";

// FIXME: there is no reason to hardcode all of these – should be
// dynamically built with the API results.
type AudienceCategoryType = {
  label: string;
  type: "audience" | "category" | "type";
  value:
    | "Design"
    | "Accessibilité"
    | "Divers"
    | "Communication"
    | "Marketing"
    | "Tech"
    | "Produit"
    | "Nouveaux membres"
    | "ELearning"
    | "Université d'été";
};
const tags: AudienceCategoryType[] = [
  {
    label: "Nouveaux arrivants",
    type: "audience",
    value: "Nouveaux membres",
  },
  {
    label: "Design",
    type: "category",
    value: "Design",
  },
  {
    label: "Université d'été",
    type: "category",
    value: "Université d'été",
  },
  {
    label: "Accessibilité",
    type: "category",
    value: "Accessibilité",
  },
  {
    label: "Divers",
    type: "category",
    value: "Divers",
  },
  {
    label: "Communication",
    type: "category",
    value: "Communication",
  },

  {
    label: "Marketing",
    type: "category",
    value: "Marketing",
  },
  {
    label: "Tech",
    type: "category",
    value: "Tech",
  },
  {
    label: "Produit",
    type: "category",
    value: "Produit",
  },
  {
    label: "E-learning",
    type: "type",
    value: "ELearning",
  },
];

const applyFilter = (
  formation: Formation,
  selectedFilter: AudienceCategoryType,
) => {
  if (selectedFilter.type === "audience") {
    return formation.audience?.includes(selectedFilter.value);
  } else if (selectedFilter.type === "type") {
    return formation.isELearning;
  } else {
    return formation.category?.includes(selectedFilter.value);
  }
};

export default function FormationList({
  inscriptions,
  formations,
}: {
  inscriptions: FormationInscription[];
  formations: Formation[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filterQuery = searchParams.get("filter") || "";
  let filtersFromQuery: string[] = filterQuery.split(",");
  const [selectedFilters, setSelectedFilters] = useState<
    AudienceCategoryType[] | []
  >(tags.filter((tag) => filtersFromQuery.includes(tag.value)));

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  useEffect(() => {
    const filterQuery = searchParams.get("filter");
    if (selectedFilters.map((f) => f.value).join(",") !== filterQuery) {
      // Update the query string whenever selectedFilters changes
      const filterValues = selectedFilters
        .map((filter) => filter.value)
        .join(",");
      router.push(pathname + "?" + createQueryString("filter", filterValues));
      sessionStorage.setItem("filter", filterValues);
    }
  }, [createQueryString, pathname, router, searchParams, selectedFilters]);

  const filterFormationWithKey = (tag: AudienceCategoryType) => {
    if (selectedFilters.find((filter) => filter.value === tag.value)) {
      setSelectedFilters([
        ...selectedFilters.filter((filter) => filter.value !== tag.value),
      ]);
    } else {
      setSelectedFilters([...selectedFilters, tag]);
    }
  };
  // Au catalogue on choisit une séance, pas un sujet : une formation
  // programmée cinq fois occupe cinq cartes, chacune avec sa date et ses
  // places. Une formation sans date garde une carte, qui l'annonce.
  const formationsParDate: Formation[] = formations.flatMap((formation) => {
    const sessions = formation.sessions ?? [];
    if (sessions.length === 0) return [formation];
    return sessions.map((session) => ({
      ...formation,
      sessionId: session.id,
      start: session.start,
      startDate: session.start,
      formation_date: session.start,
      maxSeats: session.maxSeats,
      availableSeats: session.availableSeats ?? 0,
    }));
  });

  const filteredFormations: Formation[] = selectedFilters.length
    ? formationsParDate.filter((formation) => {
        return selectedFilters.reduce((acc, filter) => {
          return !!(applyFilter(formation, filter) && acc);
        }, true);
      })
    : formationsParDate;
  filteredFormations.sort((a, b) => {
    return (a.start && b.start && a.start.getTime() - b.start.getTime()) || 0;
  });
  return (
    <div>
      <ul className="fr-tags-group fr-my-2w">
        {tags.map((tag) => (
          <li key={tag.value}>
            <Tag
              nativeButtonProps={{
                onClick: () => filterFormationWithKey(tag),
              }}
              pressed={
                !!selectedFilters.find((filter) => filter.value === tag.value)
              }
            >
              {tag.label}
            </Tag>
          </li>
        ))}
      </ul>
      {!!filteredFormations.length && (
        <div className="fr-grid-row fr-grid-row--gutters">
          {filteredFormations.map((formation) => (
            <div
              // Une même formation revient autant de fois qu'elle a de dates :
              // la date fait partie de l'identité de la carte.
              key={`${formation.id}-${formation.sessionId ?? "sans-date"}`}
              className="fr-col-md-4 fr-col-lg-4 fr-col-sm-12"
            >
              <FormationCard
                formation={formation}
                isMemberRegistered={
                  !!inscriptions.find(
                    (inscription) =>
                      inscription.formation === formation.airtable_id,
                  )
                }
                isMemberOnWaitingList={
                  !!inscriptions.find(
                    (inscription) =>
                      inscription.formation === formation.airtable_id &&
                      inscription.isInWaitingList,
                  )
                }
              />
            </div>
          ))}
        </div>
      )}
      {!filteredFormations.length && (
        <div>{`Il n'y a pas de formations correspond à ce filtre`}</div>
      )}
    </div>
  );
}

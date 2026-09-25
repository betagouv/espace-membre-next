"use client";
import { useState, useEffect, useCallback } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import FormationCard from "./FormationCard";
import { comparerAuCatalogue } from "@/lib/formationOrder";
// Import de type seulement : le module lit la configuration serveur, il n'a
// rien à faire dans le code envoyé au navigateur.
import type { GristInscription } from "@/lib/formationsGrist";
import { Formation } from "@/models/formation";
import {
  FORMATION_THEMATIQUES,
  libelleAudience,
} from "@/models/formationsGrist";

type AudienceCategoryType = {
  label: string;
  type: "audience" | "category" | "type";
  // Sert aussi dans l'URL (?filter=Design,Tech) : changer une valeur casse les
  // liens déjà partagés.
  value: string;
};
// Les thématiques viennent de la liste partagée avec le formulaire et la
// colonne Grist : une thématique ajoutée là-bas devient un filtre ici, au lieu
// de rester introuvable au catalogue.
const tags: AudienceCategoryType[] = [
  {
    label: libelleAudience("Nouveaux membres"),
    type: "audience",
    value: "Nouveaux membres",
  },
  ...FORMATION_THEMATIQUES.map(
    (thematique): AudienceCategoryType => ({
      label: thematique,
      type: "category",
      value: thematique,
    }),
  ),
  // L'e-learning est une modalité, pas une thématique Grist : il reste à part.
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
  // Inscriptions du membre, par session : c'est à une date qu'on s'inscrit,
  // pas au format.
  inscriptions: GristInscription[];
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
  filteredFormations.sort(comparerAuCatalogue);
  return (
    <div>
      {/* Titre de section : les cartes sont en h3, il leur faut un h2, et sans
          bandeau « Mes prochaines formations » il n'y en aurait aucun entre
          le h1 et elles. Même graisse que le bandeau, pour ne pas peser. */}
      <h2 className={fr.cx("fr-h6", "fr-mb-1w")}>Formations à venir</h2>
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
          {filteredFormations.map((formation) => {
            // Chaque carte est une date : on n'est « Inscrit » qu'à celle où
            // l'on s'est inscrit, pas à toutes les dates du même format. Une
            // carte sans date n'a pas de session, donc pas d'inscription.
            const inscription = formation.sessionId
              ? inscriptions.find((i) => i.sessionId === formation.sessionId)
              : undefined;
            return (
              <div
                // Une même formation revient autant de fois qu'elle a de
                // dates : la date fait partie de l'identité de la carte.
                key={`${formation.id}-${formation.sessionId ?? "sans-date"}`}
                className="fr-col-md-4 fr-col-lg-4 fr-col-sm-12"
              >
                <FormationCard
                  formation={formation}
                  isMemberRegistered={!!inscription}
                  isMemberOnWaitingList={!!inscription?.onWaitingList}
                />
              </div>
            );
          })}
        </div>
      )}
      {!filteredFormations.length && (
        <div>{`Il n'y a pas de formations correspond à ce filtre`}</div>
      )}
    </div>
  );
}

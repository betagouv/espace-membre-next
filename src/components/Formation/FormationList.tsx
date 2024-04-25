"use client";
import { useState, useEffect, useCallback, useRef } from "react";

import Tag from "@codegouvfr/react-dsfr/Tag";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import FormationCard from "./FormationCard";
import { Formation, FormationInscription } from "@/models/formation";

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
        | "ELearning";
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
    selectedFilter: AudienceCategoryType
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
        [searchParams]
    );

    useEffect(() => {
        const filterQuery = searchParams.get("filter");
        if (selectedFilters.map((f) => f.value).join(",") !== filterQuery) {
            // Update the query string whenever selectedFilters changes
            const filterValues = selectedFilters
                .map((filter) => filter.value)
                .join(",");
            router.push(
                pathname + "?" + createQueryString("filter", filterValues)
            );
            sessionStorage.setItem("filter", filterValues);
        }
    }, [createQueryString, pathname, router, searchParams, selectedFilters]);

    const filterFormationWithKey = (tag: AudienceCategoryType) => {
        if (selectedFilters.find((filter) => filter.value === tag.value)) {
            setSelectedFilters([
                ...selectedFilters.filter(
                    (filter) => filter.value !== tag.value
                ),
            ]);
        } else {
            setSelectedFilters([...selectedFilters, tag]);
        }
    };
    const filteredFormations: Formation[] = selectedFilters.length
        ? formations.filter((formation) => {
              return selectedFilters.reduce((acc, filter) => {
                  return !!(applyFilter(formation, filter) && acc);
              }, true);
          })
        : formations;
    filteredFormations.sort((a, b) => {
        return (
            (a.start && b.start && a.start.getTime() - b.start.getTime()) || 0
        );
    });
    return (
        <div>
            <ul className="fr-tags-group fr-my-2w">
                {tags.map((tag) => (
                    <Tag
                        key={tag.value}
                        nativeButtonProps={{
                            onClick: () => filterFormationWithKey(tag),
                        }}
                        pressed={
                            !!selectedFilters.find(
                                (filter) => filter.value === tag.value
                            )
                        }
                    >
                        {tag.label}
                    </Tag>
                ))}
            </ul>
            {!!filteredFormations.length && (
                <div className="fr-grid-row fr-grid-row--gutters">
                    {filteredFormations.map((formation) => (
                        <div
                            key={formation.id}
                            className="fr-col-md-4 fr-col-lg-4 fr-col-sm-12"
                        >
                            <FormationCard
                                formation={formation}
                                isMemberRegistered={
                                    !!inscriptions.find(
                                        (inscription) =>
                                            inscription.formation ===
                                            formation.airtable_id
                                    )
                                }
                                isMemberOnWaitingList={
                                    !!inscriptions.find(
                                        (inscription) =>
                                            inscription.formation ===
                                                formation.airtable_id &&
                                            inscription.isInWaitingList
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

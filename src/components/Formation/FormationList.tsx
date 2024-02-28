"use client";
import { useEffect, useState } from "react";

import { Formation, FormationInscription } from "@/models/formation";
import Tag from "@codegouvfr/react-dsfr/Tag";

import FormationCard from "./FormationCard";

type AudienceCategoryType = {
    key: string;
    label: string;
    type: "audience" | "category";
    value:
        | "Design"
        | "Accessibilité"
        | "Divers"
        | "Communication"
        | "Marketing"
        | "Tech"
        | "Produit"
        | "Nouveaux membres";
};
const tags: AudienceCategoryType[] = [
    {
        key: "newcomers",
        label: "Nouveaux arrivants",
        type: "audience",
        value: "Nouveaux membres",
    },
    {
        key: "design",
        label: "Design",
        type: "category",
        value: "Design",
    },
    {
        key: "accessibility",
        label: "Accessibilité",
        type: "category",
        value: "Accessibilité",
    },
    {
        key: "divers",
        label: "Divers",
        type: "category",
        value: "Divers",
    },
    {
        key: "communication",
        label: "Communication",
        type: "category",
        value: "Communication",
    },

    {
        key: "marketing",
        label: "Marketing",
        type: "category",
        value: "Marketing",
    },
    {
        key: "tech",
        label: "Tech",
        type: "category",
        value: "Tech",
    },
    {
        key: "product",
        label: "Produit",
        type: "category",
        value: "Produit",
    },
];

export default function FormationList({
    inscriptions,
    formations,
}: {
    inscriptions: FormationInscription[];
    formations: Formation[];
}) {
    const [selectedFilter, setSelectedFilter] = useState<
        AudienceCategoryType | undefined
    >(undefined);
    const filterFormationWithKey = (tag: AudienceCategoryType) => {
        if (selectedFilter?.value !== tag.value) {
            setSelectedFilter(tag);
        } else {
            setSelectedFilter(undefined);
        }
    };
    const filteredFormations: Formation[] = selectedFilter ? formations : 
        formations.filter((formation) => {
                    if (selectedFilter.type === "audience") {
                        return formation.audience?.includes(
                            selectedFilter.value
                        );
                    } else {
                        return formation.category?.includes(
                            selectedFilter.value
                        );
                    }
                })
    return (
        <div>
            <ul className="fr-tags-group fr-my-2w">
                {tags.map((tag) => (
                    <Tag
                        key={tag.key}
                        nativeButtonProps={{
                            onClick: () => filterFormationWithKey(tag),
                        }}
                        pressed={selectedFilter?.value === tag.value}
                    >
                        {tag.label}
                    </Tag>
                ))}
            </ul>
            {!!filteredFormations.length && (
                <div className="fr-grid-row fr-grid-row--gutters">
                    {filteredFormations.map((formation) => (
                        <div key={formation.id} className="fr-col-4">
                            <FormationCard
                                formation={formation}
                                isMemberRegistered={
                                    !!inscriptions.find(
                                        (inscription) =>
                                            inscription.formation ===
                                            formation.airtable_id
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

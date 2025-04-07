import React from "react";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";

import { Domaine } from "@/models/member";

type Item = {
    id: string;
    title: string;
    tag?: string[];
};

type Section = {
    title: string;
    items: Item[];
    tag?: string[];
};

type ChecklistProps = {
    domaine: Domaine;
    sections: Section[];
};

export default function Checklist({ domaine, sections }) {
    const isVisible = (tags?: string[]) => {
        if (!tags) return true;
        return tags.includes(domaine);
    };

    return (
        <div className="space-y-6">
            {sections.map((section, i) => {
                if (!isVisible(section.tag)) return null;

                return (
                    <Checkbox
                        key={i}
                        legend={section.title}
                        options={section.items.map((item) => ({
                            label: item.title,
                            nativeInputProps: {
                                name: "checkboxes-1",
                                value: item.id,
                            },
                        }))}
                        state="default"
                        stateRelatedMessage="State description"
                    />
                );
            })}
        </div>
    );
}

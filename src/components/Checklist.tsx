import React, { useState } from "react";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";

import { Domaine } from "@/models/member";

export function markdownLinksToReact(markdown: string): React.ReactNode[] {
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    const parts: React.ReactNode[] = [];

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(markdown)) !== null) {
        const [fullMatch, text, url] = match;
        const index = match.index;

        // Push any text before the link
        if (lastIndex < index) {
            parts.push(markdown.slice(lastIndex, index));
        }

        // Push the actual <a> element
        parts.push(<> </>);
        parts.push(
            <>
                <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link"
                >
                    {text}
                </a>
            </>
        );
        parts.push(<> </>);
        lastIndex = index + fullMatch.length;
    }

    // Push any remaining text after the last match
    if (lastIndex < markdown.length) {
        parts.push(markdown.slice(lastIndex));
    }

    return parts;
}

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
    const [selected, setSelected] = useState<string[]>([]);
    const isVisible = (tags?: string[]) => {
        if (!tags) return true;
        return tags.includes(domaine);
    };
    const onChange = (e) => {
        const value = e.target.value;
        if (selected.includes(value)) {
            setSelected([...selected].filter((v) => v !== value));
        } else {
            setSelected([...selected, value]);
        }
    };

    return (
        <div className="space-y-6">
            {sections.map((section, i) => {
                if (!isVisible(section.tag)) return null;

                return (
                    <Checkbox
                        key={i}
                        legend={<h3>{section.title}</h3>}
                        options={section.items.map((item) => ({
                            label: markdownLinksToReact(item.title),
                            nativeInputProps: {
                                name: "checkboxes-1",
                                value: item.id,
                                checked: selected.includes(item.id),
                                onChange,
                            },
                        }))}
                    />
                );
            })}
        </div>
    );
}

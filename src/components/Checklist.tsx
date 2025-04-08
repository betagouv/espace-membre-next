import React, { useState } from "react";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";

import { safeUpdateUserEvent } from "@/app/api/member/actions/updateUserEvent";
import { Domaine } from "@/models/member";
import { onboardingChecklistSchemaType } from "@/models/onboardingCheklist";

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

export default function Checklist({
    domaine,
    sections,
    userEventIds,
    handleUserEventIdsChange,
}: {
    domaine: Domaine;
    sections: onboardingChecklistSchemaType;
    userEventIds: string[];
    handleUserEventIdsChange: (eventIds: string[]) => void;
}) {
    const isVisible = (domaines?: string[]) => {
        if (!domaines) return true;
        return domaines.includes(domaine);
    };
    const onChange = async (e, field_id) => {
        const value = e.target.checked;
        if (userEventIds.includes(field_id) && !value) {
            handleUserEventIdsChange(
                [...userEventIds].filter(
                    (userEventId) => userEventId !== field_id
                )
            );
        } else if (!userEventIds.includes(field_id) && value) {
            handleUserEventIdsChange([...userEventIds, field_id]);
        }
        const res = await safeUpdateUserEvent({
            field_id,
            value,
        });
    };

    return (
        <div>
            {sections.map((section, i) => {
                if (!isVisible(section.domaines)) return null;

                return (
                    <Checkbox
                        key={i}
                        legend={<h3>{section.title}</h3>}
                        options={section.items.map((item, index) => ({
                            label: markdownLinksToReact(item.title),
                            nativeInputProps: {
                                name: `checkboxes-${index}`,
                                value: item.id,
                                defaultChecked: userEventIds.includes(item.id),
                                onChange: (e) => onChange(e, item.id),
                            },
                        }))}
                    />
                );
            })}
        </div>
    );
}

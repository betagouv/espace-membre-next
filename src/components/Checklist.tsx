import React, { useState } from "react";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import MarkdownIt from "markdown-it";

import { safeUpdateUserEvent } from "@/app/api/member/actions/updateUserEvent";
import { Domaine } from "@/models/member";
import { onboardingChecklistSchemaType } from "@/models/onboardingCheklist";

const mdParser = new MarkdownIt({
    html: true,
});

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
                            label: (
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: mdParser.renderInline(
                                            item.title
                                        ),
                                    }}
                                />
                            ),
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

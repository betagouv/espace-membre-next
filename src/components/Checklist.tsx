import React, { useState } from "react";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import MarkdownIt from "markdown-it";

import { safeUpdateUserEvent } from "@/app/api/member/actions/updateUserEvent";
import { Domaine } from "@/models/member";
import { onboardingChecklistSchemaType } from "@/models/onboardingChecklist";
import Accordion from "@codegouvfr/react-dsfr/Accordion";

const mdParser = new MarkdownIt({
    html: true,
});

mdParser.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    tokens[idx].attrPush(["class", "fr-link"]); // Add class
    tokens[idx].attrPush(["target", "_blank"]); // Add class
    return self.renderToken(tokens, idx, options);
};

export default function Checklist({
    domaine,
    sections,
    userEventIds,
    handleUserEventIdsChange,
    userUuid,
}: {
    domaine: Domaine;
    sections: onboardingChecklistSchemaType;
    userEventIds: string[];
    handleUserEventIdsChange: (eventIds: string[]) => void;
    userUuid: string;
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
            action_on_user_id: userUuid,
            field_id,
            value,
        });
        if (!res.success) {
            console.error(res);
        }
    };

    return (
        <div>
            {sections.map((section, i) => {
                if (!isVisible(section.domaines)) return null;
                return (
                    <Accordion key={i}
                        label={section.title} defaultExpanded={i === 0}>
                        <Checkbox
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
                                    disabled: item.disabled,
                                    defaultChecked:
                                        item.defaultValue ||
                                        userEventIds.includes(item.id),
                                    onChange: (e) => onChange(e, item.id),
                                },
                            }))}
                        /></Accordion>
                );
            })}
        </div>
    );
}

import React, { useState } from "react";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import MarkdownIt from "markdown-it";

import { safeUpdateUserEvent } from "@/app/api/member/actions/updateUserEvent";
import { Domaine } from "@/models/member";
import { checklistSchemaType } from "@/models/checklist";
import { isRestrictedChecklistItem } from "@/utils/checklists/restrictedChecklistItems";
import Accordion from "@codegouvfr/react-dsfr/Accordion";

const mdParser = new MarkdownIt({
  html: true,
});

mdParser.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrPush(["class", "fr-link"]); // Add class
  tokens[idx].attrPush(["target", "_blank"]); // Add class
  return self.renderToken(tokens, idx, options);
};

const RESTRICTED_ITEM_HINT =
  "Cette case est cochée par l'équipe d'animation, après la participation à l'embarquement.";

export default function Checklist({
  domaine,
  sections,
  userEventIds,
  handleUserEventIdsChange,
  userUuid,
  readOnly,
  canValidateRestrictedItems = false,
}: {
  domaine: Domaine;
  sections: checklistSchemaType;
  userEventIds: string[];
  handleUserEventIdsChange: (eventIds: string[]) => void;
  userUuid: string;
  readOnly: boolean;
  canValidateRestrictedItems?: boolean;
}) {
  const [error, setError] = useState<{
    sectionIndex: number;
    message: string;
  } | null>(null);
  const isVisible = (domaines?: string[]) => {
    if (!domaines) return true;
    return domaines.includes(domaine);
  };
  const onChange = async (e, field_id, sectionIndex) => {
    const input = e.target as HTMLInputElement;
    const value = input.checked;
    const previousUserEventIds = userEventIds;
    setError(null);
    if (userEventIds.includes(field_id) && !value) {
      handleUserEventIdsChange(
        userEventIds.filter((userEventId) => userEventId !== field_id),
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
      // Rien n'a été enregistré : on remet la case et la progression dans leur
      // état précédent, sinon l'utilisateur croit que c'est pris en compte.
      console.error("ERROR", res.message);
      handleUserEventIdsChange(previousUserEventIds);
      input.checked = !value;
      setError({ sectionIndex, message: res.message });
    }
  };

  return (
    <div>
      {sections.map((section, i) => {
        const expand =
          i === 0 || section.items.some((i) => userEventIds.includes(i.id));
        if (!isVisible(section.domaines)) return null;
        return (
          <Accordion
            key={section.title + i}
            label={section.title}
            defaultExpanded={expand}
          >
            <Checkbox
              state={error?.sectionIndex === i ? "error" : "default"}
              stateRelatedMessage={
                error?.sectionIndex === i ? error.message : undefined
              }
              options={section.items.map((item, index) => {
                const isRestricted = isRestrictedChecklistItem(item.id);
                return {
                  label: (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: mdParser.renderInline(item.title),
                      }}
                    />
                  ),
                  hintText: isRestricted ? RESTRICTED_ITEM_HINT : undefined,
                  nativeInputProps: {
                    name: `checkboxes-${index}`,
                    value: item.id,
                    // Un item réservé échappe à readOnly : l'équipe d'animation
                    // doit pouvoir l'attester y compris sur la fiche d'un membre
                    // qu'elle n'a pas le droit d'éditer par ailleurs.
                    disabled:
                      item.disabled ||
                      (isRestricted ? !canValidateRestrictedItems : readOnly),
                    defaultChecked:
                      item.defaultValue || userEventIds.includes(item.id),
                    onChange: (e) => onChange(e, item.id, i),
                  },
                };
              })}
            />
          </Accordion>
        );
      })}
    </div>
  );
}

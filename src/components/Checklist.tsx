import React, { useState } from "react";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import MarkdownIt from "markdown-it";

import { safeUpdateUserEvent } from "@/app/api/member/actions/updateUserEvent";
import { Domaine } from "@/models/member";
import { checklistItemType, checklistSchemaType } from "@/models/checklist";
import { isVisibleForDomaine } from "@/lib/checklists/filterByDomaine";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import {
  ChecklistNotConcerned,
  NotConcernedByField,
} from "./ChecklistNotConcerned";

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

/**
 * Découpe les items d'une section en groupes de cases : un item qui propose
 * « non concerné » ferme son groupe, pour que le bloc motif s'affiche juste
 * sous lui.
 */
function groupItems(items: checklistItemType[]): checklistItemType[][] {
  const groups: checklistItemType[][] = [];
  let current: checklistItemType[] = [];
  for (const item of items) {
    current.push(item);
    if (item.notConcerned) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

function omit(byField: NotConcernedByField, fieldId: string) {
  const { [fieldId]: _, ...rest } = byField;
  return rest;
}

export default function Checklist({
  domaine,
  sections,
  userEventIds,
  handleUserEventIdsChange,
  notConcernedByField = {},
  handleNotConcernedByFieldChange = () => {},
  userUuid,
  readOnly,
  canValidateRestrictedItems = false,
}: {
  domaine: Domaine;
  sections: checklistSchemaType;
  // Items enregistrés en base, faits ou « non concernés » : les deux comptent
  // dans la progression.
  userEventIds: string[];
  handleUserEventIdsChange: (eventIds: string[]) => void;
  notConcernedByField?: NotConcernedByField;
  handleNotConcernedByFieldChange?: (byField: NotConcernedByField) => void;
  userUuid: string;
  readOnly: boolean;
  canValidateRestrictedItems?: boolean;
}) {
  const [error, setError] = useState<{
    fieldId: string;
    message: string;
  } | null>(null);

  const isDone = (fieldId: string) =>
    userEventIds.includes(fieldId) && !notConcernedByField[fieldId];

  const onChange = async (e, field_id) => {
    const value = (e.target as HTMLInputElement).checked;
    const previousUserEventIds = userEventIds;
    const previousNotConcerned = notConcernedByField;
    setError(null);
    if (!value) {
      handleUserEventIdsChange(
        userEventIds.filter((userEventId) => userEventId !== field_id),
      );
    } else if (!userEventIds.includes(field_id)) {
      handleUserEventIdsChange([...userEventIds, field_id]);
    }
    // Cocher l'item comme fait remplace un « non concerné » : le serveur remet
    // le motif à null.
    if (notConcernedByField[field_id]) {
      handleNotConcernedByFieldChange(omit(notConcernedByField, field_id));
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
      handleNotConcernedByFieldChange(previousNotConcerned);
      setError({ fieldId: field_id, message: res.message });
    }
  };

  const saveNotConcerned = async (
    field_id: string,
    reason: string,
    comment: string,
  ) => {
    setError(null);
    const res = await safeUpdateUserEvent({
      action_on_user_id: userUuid,
      field_id,
      value: true,
      not_concerned: { reason, comment },
    });
    if (res.success) {
      if (!userEventIds.includes(field_id)) {
        handleUserEventIdsChange([...userEventIds, field_id]);
      }
      handleNotConcernedByFieldChange({
        ...notConcernedByField,
        [field_id]: { reason, comment: comment.trim() || null },
      });
    }
    return res;
  };

  const clearNotConcerned = async (field_id: string) => {
    setError(null);
    const res = await safeUpdateUserEvent({
      action_on_user_id: userUuid,
      field_id,
      value: false,
    });
    if (res.success) {
      handleUserEventIdsChange(
        userEventIds.filter((userEventId) => userEventId !== field_id),
      );
      handleNotConcernedByFieldChange(omit(notConcernedByField, field_id));
    }
    return res;
  };

  return (
    <div>
      {sections.map((section, i) => {
        if (!isVisibleForDomaine(section.domaines, domaine)) return null;
        const visibleItems = section.items.filter((item) =>
          isVisibleForDomaine(item.domaines, domaine),
        );
        if (visibleItems.length === 0) return null;
        const expand =
          i === 0 || visibleItems.some((i) => userEventIds.includes(i.id));
        return (
          <Accordion
            key={section.title + i}
            label={section.title}
            defaultExpanded={expand}
          >
            {groupItems(visibleItems).map((items, groupIndex) => {
              const groupError = items.some((it) => it.id === error?.fieldId)
                ? error
                : null;
              const last = items[items.length - 1];
              return (
                <React.Fragment key={last.id}>
                  <Checkbox
                    state={groupError ? "error" : "default"}
                    stateRelatedMessage={groupError?.message}
                    options={items.map((item, index) => {
                      const isRestricted = !!item.restricted;
                      return {
                        label: (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: mdParser.renderInline(item.title),
                            }}
                          />
                        ),
                        hintText: isRestricted
                          ? RESTRICTED_ITEM_HINT
                          : undefined,
                        nativeInputProps: {
                          name: `checkboxes-${groupIndex}-${index}`,
                          value: item.id,
                          // Un item réservé échappe à readOnly : l'équipe
                          // d'animation doit pouvoir l'attester y compris sur
                          // la fiche d'un membre qu'elle n'a pas le droit
                          // d'éditer par ailleurs.
                          disabled:
                            item.disabled ||
                            (isRestricted
                              ? !canValidateRestrictedItems
                              : readOnly),
                          checked: !!item.defaultValue || isDone(item.id),
                          onChange: (e) => onChange(e, item.id),
                        },
                      };
                    })}
                  />
                  {last.notConcerned && (
                    <ChecklistNotConcerned
                      config={last.notConcerned}
                      saved={notConcernedByField[last.id]}
                      done={isDone(last.id)}
                      readOnly={
                        last.restricted ? !canValidateRestrictedItems : readOnly
                      }
                      onSave={(reason, comment) =>
                        saveNotConcerned(last.id, reason, comment)
                      }
                      onClear={() => clearNotConcerned(last.id)}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </Accordion>
        );
      })}
    </div>
  );
}

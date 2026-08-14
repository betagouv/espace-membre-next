import { checklistSchemaType } from "@/models/checklist";
import { Domaine } from "@/models/member";
import { filterChecklistForDomaine } from "./filterByDomaine";

export function computeProgress(
  userEventIds: string[],
  checklistObject: checklistSchemaType,
  offset: number = 0,
  domaine?: Domaine,
): number {
  const visibleChecklist = domaine
    ? filterChecklistForDomaine(checklistObject, domaine)
    : checklistObject;
  const allCheckListItemIds = visibleChecklist.flatMap((section) =>
    section.items.map((item) => item.id),
  );
  const total = allCheckListItemIds.length;
  const matchCount =
    allCheckListItemIds.filter((id) => userEventIds.includes(id)).length +
    offset;
  const percentage = total > 0 ? (matchCount / total) * 100 : 0;
  return percentage;
}

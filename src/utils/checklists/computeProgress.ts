import { checklistSchemaType } from "@/models/checklist";

export function computeProgress(
  userEventIds: string[],
  checklistObject: checklistSchemaType,
  offset: number = 0,
): number {
  const allCheckListItemIds = checklistObject.flatMap((section) =>
    section.items.map((item) => item.id),
  );
  const total = allCheckListItemIds.length;
  const matchCount =
    allCheckListItemIds.filter((id) => userEventIds.includes(id)).length +
    offset;
  const percentage = total > 0 ? (matchCount / total) * 100 : 0;
  return percentage;
}

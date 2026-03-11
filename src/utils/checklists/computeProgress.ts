import { checklistSchemaType } from "@/models/checklist";

export function computeProgress(
  userEventIds: string[],
  checklistObject: checklistSchemaType,
): number {
  const allCheckListItemIds = checklistObject.flatMap((section) =>
    section.items.map((item) => item.id),
  );
  const total = allCheckListItemIds.length;
  const matchCount = allCheckListItemIds.filter((id) =>
    userEventIds.includes(id),
  ).length;
  const percentage = total > 0 ? (matchCount / total) * 100 : 0;
  return percentage;
}

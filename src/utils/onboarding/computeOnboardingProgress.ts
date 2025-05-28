import { onboardingChecklistSchemaType } from "@/models/onboardingChecklist";
import { userEventSchemaType } from "@/models/userEvent";

export function computeOnboardingProgress(
    userEventIds: string[],
    checklistObject: onboardingChecklistSchemaType,
): number {
    const allCheckListItemIds = checklistObject.flatMap((section) =>
        section.items.map((item) => item.id),
    );
    const total = allCheckListItemIds.length;
    // default to 1, has "créer une fiche" is always true
    const matchCount =
        allCheckListItemIds.filter((id) => userEventIds.includes(id)).length +
        1;
    const percentage = total > 0 ? (matchCount / total) * 100 : 0;

    return percentage;
}

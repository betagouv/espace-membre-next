import { onboardingChecklistSchemaType } from "@/models/onboardingCheklist";
import { userEventSchemaType } from "@/models/userEvent";

export function computeOnboardingProgress(
    userEvents: userEventSchemaType[],
    checklistObject: onboardingChecklistSchemaType
): number {
    const userEventsIds = userEvents
        .filter((u) => u.date !== null)
        .map((u) => u.field_id);

    const allCheckListItemIds = checklistObject.flatMap((section) =>
        section.items.map((item) => item.id)
    );
    const total = userEventsIds.length;
    const matchCount = userEventsIds.filter((id) =>
        allCheckListItemIds.includes(id)
    ).length;
    const percentage = total > 0 ? (matchCount / total) * 100 : 0;

    return percentage;
}

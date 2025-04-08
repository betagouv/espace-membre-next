import { getUserStartups } from "@/lib/kysely/queries/users";
import { memberSchemaType, memberBaseInfoSchemaType } from "@/models/member";
import config from "@/server/config";

export async function shouldShowOnboardingPanel(
    user: memberSchemaType | memberBaseInfoSchemaType
): Promise<boolean> {
    if (config.FEATURE_TMP_SHOW_ONBOARDING_TO_EVERYONE) {
        return true;
    }
    const featureImplementedDate = new Date("08/04/2025");
    const userIsNew =
        user.missions.length === 1 &&
        user.missions[0].start >= featureImplementedDate;
    if (userIsNew) {
        const userStartups = await getUserStartups(user.uuid);
        const incubatorIds = userStartups
            .map((user) => user.incubator_id)
            .filter((id) => id !== null);
        return !!incubatorIds.find((incubatorId) =>
            config.ONBOARDING_INCUBATOR_IDS.includes(incubatorId)
        );
    }
    return false;
}

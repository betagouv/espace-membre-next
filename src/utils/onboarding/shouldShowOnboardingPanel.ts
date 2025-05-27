import { getUserStartups } from "@/lib/kysely/queries/users";
import { memberSchemaType, memberBaseInfoSchemaType } from "@/models/member";
import config from "@/server/config";

export async function shouldShowOnboardingPanel(
  user: memberSchemaType | memberBaseInfoSchemaType,
): Promise<boolean> {
  if (config.FEATURE_TMP_SHOW_ONBOARDING_TO_EVERYONE) {
    return true;
  }
  const featureImplementedDate = new Date("01/01/2025");
  const userIsNew =
    user.missions.length === 1 &&
    user.missions[0].start >= featureImplementedDate;
  return userIsNew;
}

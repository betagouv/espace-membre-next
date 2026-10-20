import { MemberPageProps } from "@/components/MemberPage/MemberPage";
import { getUserEvents } from "@/lib/kysely/queries/userEvents";
import { Domaine } from "@/models/member";
import { computeProgress } from "./computeProgress";
import {
  getChecklistObject,
  getOnboardingChecklistType,
} from "./getChecklistObject";

export const getUserChecklists = async (
  uuid: string,
  domaine: Domaine,
  createdAt: Date,
) => {
  const userEvents = await getUserEvents(uuid);
  const userEventIds = userEvents.map((u) => u.field_id);

  let onboarding: MemberPageProps["onboarding"];
  const onboardingType = getOnboardingChecklistType(domaine, createdAt);
  const checklistOnboardingObject = await getChecklistObject(onboardingType);

  if (checklistOnboardingObject) {
    const progress = computeProgress(
      userEventIds,
      checklistOnboardingObject,
      1,
      domaine,
    );
    onboarding = {
      type: onboardingType,
      progress,
      userEvents,
      checklistObject: checklistOnboardingObject,
    };
  }

  let offboarding: MemberPageProps["offboarding"];
  const checklistOffboardingObject = await getChecklistObject("offboarding");
  if (checklistOffboardingObject) {
    const progress = computeProgress(
      userEventIds,
      checklistOffboardingObject,
      0,
      domaine,
    );
    offboarding = {
      type: "offboarding",
      progress,
      userEvents,
      checklistObject: checklistOffboardingObject,
    };
  }
  return { onboarding, offboarding };
};

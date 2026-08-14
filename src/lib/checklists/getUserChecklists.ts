import { MemberPageProps } from "@/components/MemberPage/MemberPage";
import { getUserEvents } from "@/lib/kysely/queries/userEvents";
import { Domaine } from "@/models/member";
import { computeProgress } from "./computeProgress";
import { getChecklistObject } from "./getChecklistObject";

export const getUserChecklists = async (uuid: string, domaine: Domaine) => {
  const userEvents = await getUserEvents(uuid);
  const userEventIds = userEvents.map((u) => u.field_id);

  let onboarding: MemberPageProps["onboarding"];
  const checklistOnboardingObject = await getChecklistObject("onboarding");

  if (checklistOnboardingObject) {
    const progress = computeProgress(
      userEventIds,
      checklistOnboardingObject,
      1,
      domaine,
    );
    onboarding = {
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
      progress,
      userEvents,
      checklistObject: checklistOffboardingObject,
    };
  }
  return { onboarding, offboarding };
};

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { getUserInformations } from "@/app/api/member/getInfo";
import MemberPage, {
  MemberPageProps,
} from "@/components/MemberPage/MemberPage";
import { getUserEvents } from "@/lib/kysely/queries/userEvents";
import { userInfos } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import { computeProgress } from "@/utils/checklists/computeProgress";
import { getChecklistObject } from "@/utils/checklists/getChecklistObject";
import { routeTitles } from "@/utils/routes/routeTitles";
import { getUserIncubators } from "@/lib/kysely/queries/users";

export const metadata: Metadata = {
  title: `${routeTitles.account()} / Espace Membre`,
};

export default async function Page() {
  // todo: merge with community/id/page
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const id = session?.user?.id;

  // compile some account informations
  const user = await userInfos({ username: id }, session.user.id === id);

  // compile some other infos
  const userInformations = await getUserInformations(id);

  if (!userInformations) {
    throw new Error("Cannot find user");
  }

  const isAdmin = !!session.user.isAdmin;

  const userEvents = await getUserEvents(session.user.uuid);
  const userEventIds = userEvents.map((u) => u.field_id);

  let onboarding: MemberPageProps["onboarding"];
  const checklistOnboardingObject = await getChecklistObject("onboarding");

  if (checklistOnboardingObject) {
    const progress = await computeProgress(
      userEventIds,
      checklistOnboardingObject,
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
    const progress = await computeProgress(
      userEventIds,
      checklistOffboardingObject,
    );
    offboarding = {
      progress,
      userEvents,
      checklistObject: checklistOffboardingObject,
    };
  }

  const incubators = await getUserIncubators(userInformations.baseInfo.uuid);

  return (
    <MemberPage
      isAdmin={isAdmin}
      authorizations={user.authorizations}
      emailInfos={user.emailInfos}
      emailRedirections={user.emailRedirections}
      isExpired={user.isExpired}
      avatar={userInformations.avatar} // todo
      changes={userInformations.changes}
      userInfos={userInformations.baseInfo}
      mattermostInfo={userInformations.mattermostInfo}
      matomoInfo={userInformations.matomoInfo}
      sentryInfo={userInformations.sentryInfo}
      startups={userInformations.startups}
      canEditMember={true}
      canValidateMember={false}
      isCurrentUser={true}
      onboarding={onboarding}
      offboarding={offboarding}
      incubators={incubators}
    />
  );
}

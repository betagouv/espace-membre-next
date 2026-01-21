import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { getUserInformations } from "@/app/api/member/getInfo";
import MemberPage, {
  MemberPageProps,
} from "@/components/MemberPage/MemberPage";
import { getUserEvents } from "@/lib/kysely/queries/userEvents";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import { userInfos } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import { computeOnboardingProgress } from "@/utils/onboarding/computeOnboardingProgress";
import { getChecklistObject } from "@/utils/onboarding/getChecklistObject";
import { shouldShowOnboardingPanel } from "@/utils/onboarding/shouldShowOnboardingPanel";
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

  let availableEmailPros: string[] = [];
  if (config.ESPACE_MEMBRE_ADMIN.includes(session.user.id)) {
    availableEmailPros = await betagouv.getAvailableProEmailInfos();
  }

  // compile some account informations
  const user = await userInfos({ username: id }, session.user.id === id);

  // compile some other infos
  const userInformations = await getUserInformations(id);

  if (!userInformations) {
    throw new Error("Cannot find user");
  }

  const isAdmin = !!session.user.isAdmin;

  let onboarding: MemberPageProps["onboarding"];
  const showOnboardingPanel = await shouldShowOnboardingPanel(user.userInfos);
  if (showOnboardingPanel) {
    const userEvents = await getUserEvents(session.user.uuid);
    const checklistObject = await getChecklistObject();
    if (checklistObject) {
      const userEventIds = userEvents.map((u) => u.field_id);
      const progress = await computeOnboardingProgress(
        userEventIds,
        checklistObject,
      );
      onboarding = {
        progress,
        userEvents,
        checklistObject,
      };
    }
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
      sessionUserIsFromIncubatorTeam={false}
      isCurrentUser={true}
      onboarding={onboarding}
      incubators={incubators}
    />
  );
}

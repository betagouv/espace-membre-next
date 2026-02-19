import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  DashboardPage,
  DashboardPageProps,
} from "@/components/Dashboard/DashboardPage";
import { SURVEY_BOX_COOKIE_NAME } from "@/components/SurveyBox";
import { getLatests as getLatestsStartups } from "@/lib/kysely/queries/startups";
import { getUserEvents } from "@/lib/kysely/queries/userEvents";
import {
  getUserInfos,
  getLatests as getLatestsMembers,
} from "@/lib/kysely/queries/users";
import { userInfosToModel } from "@/models/mapper";
import { EmailStatusCode } from "@/models/member";
import { computeOnboardingProgress } from "@/utils/onboarding/computeOnboardingProgress";
import { getChecklistObject } from "@/utils/onboarding/getChecklistObject";
import { routeTitles } from "@/utils/routes/routeTitles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authoptions";
import betagouv from "@/server/betagouv";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";

export const metadata: Metadata = {
  title: `${routeTitles.dashboard()} / Espace Membre`,
};

export default async function Page(props) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return redirect("/login");
  }
  const userInfos = userInfosToModel(
    await getUserInfos({
      username: session?.user?.id,
      options: { withDetails: true },
    }),
  );
  if (
    userInfos.primary_email_status ===
    EmailStatusCode.EMAIL_VERIFICATION_WAITING
  ) {
    return redirect("/verify");
  }

  const lastestProducts = await getLatestsStartups();
  const lastestMembers = await getLatestsMembers();
  const cookieStore = cookies();
  const surveyCookie = cookieStore.get(SURVEY_BOX_COOKIE_NAME);
  const surveyCookieValue = (surveyCookie && surveyCookie.value) || null;
  const emailInfos = await betagouv.emailInfos(userInfos.username);
  const showSuiteNumeriqueOnboardingPanel =
    userInfos.primary_email &&
    (emailInfos?.emailPlan === EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO ||
      emailInfos?.emailPlan === EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC ||
      emailInfos?.emailPlan === EMAIL_PLAN_TYPE.EMAIL_PLAN_EXCHANGE);
  let onboarding: DashboardPageProps["onboarding"];
  if (userInfos.created_at >= new Date("2025-01-01")) {
    const userEvents = await getUserEvents(session.user.uuid);
    const checklistObject = await getChecklistObject();
    if (checklistObject) {
      const userEventIds = userEvents.map((u) => u.field_id);
      const progress = await computeOnboardingProgress(
        userEventIds,
        checklistObject,
      );
      onboarding =
        progress !== 100
          ? {
              progress,
            }
          : undefined;
    }
  }
  return (
    <DashboardPage
      {...props}
      surveyCookieValue={surveyCookieValue}
      latestProducts={lastestProducts}
      latestMembers={lastestMembers}
      onboarding={onboarding}
      secondaryEmail={userInfos.secondary_email}
      showSuiteNumeriqueOnboardingPanel={showSuiteNumeriqueOnboardingPanel}
    />
  );
}

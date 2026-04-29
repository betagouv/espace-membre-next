import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  DashboardPage,
  DashboardPageProps,
} from "@/components/Dashboard/DashboardPage";
import { SURVEY_BOX_COOKIE_NAME } from "@/components/SurveyBox";
import { getLatests as getLatestsStartups } from "@/lib/kysely/queries/startups";
import {
  getUserInfos,
  getLatests as getLatestsMembers,
} from "@/lib/kysely/queries/users";
import { userInfosToModel } from "@/models/mapper";
import { EmailStatusCode } from "@/models/member";
import { routeTitles } from "@/utils/routes/routeTitles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authoptions";
import { getUserChecklists } from "@/utils/checklists/getUserChecklists";

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
  const cookieStore = await cookies();
  const surveyCookie = cookieStore.get(SURVEY_BOX_COOKIE_NAME);
  const surveyCookieValue = (surveyCookie && surveyCookie.value) || null;

  let onboarding: DashboardPageProps["onboarding"];
  let offboarding: DashboardPageProps["offboarding"];
  const checklists = await getUserChecklists(session.user.uuid);
  if (userInfos.created_at >= new Date("2025-01-01")) {
    onboarding = checklists.onboarding;
  }
  if (userInfos.missions.length) {
    // check if user leave in less than 45 days
    // to show offboarding panel
    const maxEnd = userInfos.missions
      .map((m) => m.end)
      .filter((m) => !!m)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    const daysBeforeDeparture =
      (new Date(maxEnd).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysBeforeDeparture <= 45) {
      offboarding = checklists.offboarding;
    }
  }
  return (
    <DashboardPage
      surveyCookieValue={surveyCookieValue}
      latestProducts={lastestProducts}
      latestMembers={lastestMembers}
      onboarding={onboarding}
      offboarding={offboarding}
      secondaryEmail={userInfos.secondary_email}
    />
  );
}

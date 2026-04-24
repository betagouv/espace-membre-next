import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { getUserInformations } from "@/app/api/member/getInfo";
import { userInfos } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";
import { getUserIncubators } from "@/lib/kysely/queries/users";
import { getUserChecklists } from "@/utils/checklists/getUserChecklists";
import MemberPage from "@/components/MemberPage/MemberPage";

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

  const { onboarding, offboarding } = await getUserChecklists(
    session.user.uuid,
  );

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

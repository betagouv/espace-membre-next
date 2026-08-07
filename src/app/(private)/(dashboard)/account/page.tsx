import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";

import { authOptions } from "@/lib/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";
import { buildMemberPageProps } from "@/lib/memberPageProps";
import MemberPage from "@/components/MemberPage/MemberPage";

export const metadata: Metadata = {
  title: `${routeTitles.account()} / Espace Membre`,
};

export default async function Page() {
  const session = (await getServerSession(authOptions)) as Session;
  if (!session) {
    redirect("/login");
  }

  const memberPageProps = await buildMemberPageProps({
    session,
    memberId: session.user.id,
    isCurrentUser: true,
  });

  return <MemberPage {...memberPageProps} />;
}

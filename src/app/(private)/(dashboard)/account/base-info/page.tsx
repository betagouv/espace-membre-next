import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";
import { buildBaseInfoPageProps } from "@/lib/baseInfoPageProps";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
  title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

export default async function Page() {
  const session = await getServerSession(authOptions) as { user: { id: string } };
  if (!session) {
    redirect("/login");
  }

  const props = await buildBaseInfoPageProps(session.user.id);
  return <BaseInfoUpdate {...props} />;
}

import { routeTitles } from "@/lib/routes";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import { MemberUpdate } from "@/components/MemberUpdate/MemberUpdate";
import { getAllStartups } from "@/lib/kysely/queries";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import { authOptions } from "@/lib/authoptions";

import { getMemberMissionsRight } from "@/lib/authorization/member";
import { toAuthSubject } from "@/lib/authorization/subject";

export const metadata: Metadata = {
  title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

export default async function Page(segmentData: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await segmentData.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  const username = session.user.id;
  const dbData = await getUserBasicInfo({ username: id });
  if (!dbData) {
    redirect("/community");
  }
  const userInfos = memberBaseInfoToModel(dbData);

  const startups = await getAllStartups();

  const startupOptions = startups.map((startup) => ({
    value: startup.uuid,
    label: startup.name || "",
  }));

  const subject = toAuthSubject(session);
  if (!subject || !(await getMemberMissionsRight(subject, userInfos))) {
    redirect(`/community/${id}`);
  }

  if (!userInfos) {
    redirect("/errors");
  }

  const props = {
    userInfos,
    startupOptions,
  };

  return (
    <>
      <MemberUpdate {...props} />
      <BreadCrumbFiller
        currentPage={userInfos.fullname}
        currentItemId={userInfos.username}
      />
    </>
  );
}

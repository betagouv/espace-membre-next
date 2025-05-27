import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";
import { getEventListByUsername } from "@/lib/events";
import { getAllStartups } from "@/lib/kysely/queries";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { getAvatarUrl } from "@/lib/s3";
import { memberChangeToModel, userInfosToModel } from "@/models/mapper";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
  title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  const username = session.user.id;
  const dbData = await getUserInfos({ username });
  const userInfos = userInfosToModel(dbData);
  const s3Key = `members/${username}/avatar.jpg`;

  const startups = await getAllStartups();
  const startupOptions = startups.map((startup) => ({
    value: startup.uuid,
    label: startup.name || "",
  }));
  if (!userInfos) {
    redirect("/errors");
  }

  const changes = await getEventListByUsername(username);

  const props = {
    changes: changes.map((change) => memberChangeToModel(change)),
    formData: {
      member: {
        ...userInfos,
      },
    },
    profileURL: await getAvatarUrl(username),
    username,
    startupOptions,
  };

  return <BaseInfoUpdate {...props} />;
}

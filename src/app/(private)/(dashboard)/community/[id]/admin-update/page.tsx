import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";
import { getEventListByUsername } from "@/lib/events";
import { getAllStartups } from "@/lib/kysely/queries";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { getAvatarUrl } from "@/lib/s3";
import { memberChangeToModel, userInfosToModel } from "@/models/mapper";
import { authOptions } from "@/lib/authoptions";

export const generateMetadata = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;
  const dbData = await getUserInfos({ username: id });

  return {
    title: `Mise à jour des infos de ${dbData?.fullname} / Espace Membre`,
  };
};

export default async function Page(segmentData: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await segmentData.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (!session.user.isAdmin) {
    redirect(`/community/${id}`);
  }
  const dbData = await getUserInfos({ username: id });
  const userInfos = userInfosToModel(dbData);
  const startups = await getAllStartups();
  const startupOptions = startups.map((startup) => ({
    value: startup.uuid,
    label: startup.name || "",
  }));
  if (!userInfos) {
    redirect("/errors");
  }

  const changes = await getEventListByUsername(id);

  const props = {
    formData: {
      member: {
        ...userInfos,
      },
    },
    changes: changes.map((change) => memberChangeToModel(change)),
    profileURL: await getAvatarUrl(id),
    startupOptions,
    username: id,
  };

  return (
    <>
      <BreadCrumbFiller
        currentPage={userInfos.fullname}
        currentItemId={userInfos.username}
      />
      <BaseInfoUpdate {...props} />
    </>
  );
}

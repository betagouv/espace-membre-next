import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";
import { buildBaseInfoPageProps } from "@/lib/baseInfoPageProps";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { authOptions } from "@/utils/authoptions";

export const generateMetadata = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const dbData = await getUserInfos({ username: id });
  return {
    title: `Mise à jour des infos de ${dbData?.fullname} / Espace Membre`,
  };
};

export default async function Page({
  params: { id },
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions) as { user: { isAdmin: boolean } };
  if (!session) {
    redirect("/login");
  }
  if (!session.user.isAdmin) {
    redirect(`/community/${id}`);
  }

  const props = await buildBaseInfoPageProps(id);
  return (
    <>
      <BreadCrumbFiller
        currentPage={props.fullname}
        currentItemId={id}
      />
      <BaseInfoUpdate {...props} />
    </>
  );
}

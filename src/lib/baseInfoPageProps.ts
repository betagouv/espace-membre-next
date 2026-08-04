import { BaseInfoUpdateProps } from "@/components/BaseInfoUpdatePage/BaseInfoUpdate";
import { getEventListByUsername } from "@/lib/events";
import { getAllStartups } from "@/lib/kysely/queries";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { getAvatarUrl } from "@/lib/s3";
import { memberChangeToModel, userInfosToModel } from "@/models/mapper";
import { memberInfoUpdateSchema } from "@/models/actions/member";
import { redirect } from "next/navigation";

export async function buildBaseInfoPageProps(
  username: string,
  fullname?: string,
): Promise<BaseInfoUpdateProps & { fullname: string }> {
  const dbData = await getUserInfos({ username });
  const userInfos = userInfosToModel(dbData);

  if (!userInfos) {
    redirect("/errors");
  }

  const [startups, changes, profileURL] = await Promise.all([
    getAllStartups().then((s) =>
      s.map((startup) => ({
        value: startup.uuid,
        label: startup.name || "",
      })),
    ),
    getEventListByUsername(username).then((events) =>
      events.map(memberChangeToModel),
    ),
    getAvatarUrl(username),
  ]);

  const member = memberInfoUpdateSchema.shape.member.parse(userInfos);

  return {
    changes,
    formData: { member },
    profileURL,
    username,
    startupOptions: startups,
    fullname: fullname || member.fullname,
  };
}

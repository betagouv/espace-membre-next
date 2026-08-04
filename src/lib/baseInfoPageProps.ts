import { z } from "zod";

import { BaseInfoUpdateProps } from "@/components/BaseInfoUpdatePage/BaseInfoUpdate";
import { getEventListByUsername } from "@/lib/events";
import { getAllStartups } from "@/lib/kysely/queries";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { getAvatarUrl } from "@/lib/s3";
import { memberChangeToModel, userInfosToModel } from "@/models/mapper";
import { memberSchema } from "@/models/member";
import { redirect } from "next/navigation";

const memberFormSchema = z.object({
  fullname: memberSchema.shape.fullname,
  role: memberSchema.shape.role,
  link: memberSchema.shape.link,
  avatar: memberSchema.shape.avatar,
  github: memberSchema.shape.github,
  competences: memberSchema.shape.competences,
  teams: memberSchema.shape.teams,
  missions: memberSchema.shape.missions,
  domaine: memberSchema.shape.domaine,
  bio: memberSchema.shape.bio,
  memberType: memberSchema.shape.memberType,
  gender: memberSchema.shape.gender,
  average_nb_of_days: memberSchema.shape.average_nb_of_days,
  legal_status: memberSchema.shape.legal_status,
  workplace_insee_code: memberSchema.shape.workplace_insee_code,
  osm_city: memberSchema.shape.osm_city,
});

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

  const member = memberFormSchema.parse(userInfos);

  return {
    changes,
    formData: { member },
    profileURL,
    username,
    startupOptions: startups,
    fullname: fullname || member.fullname,
  };
}

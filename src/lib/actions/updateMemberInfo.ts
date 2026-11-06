"use server";

import { updateMember } from "@/app/api/member/updateMember";
import { assertCanEditMemberFullInfo } from "@/lib/authorization/member";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { memberInfoUpdateSchema } from "@/models/actions/member";
import { NoDataError, withErrorHandling } from "@/lib/error";

async function updateMemberInfoAction({
  username,
  memberData,
}: {
  username: string;
  memberData: unknown;
}) {
  const previousInfo = await getUserInfos({ username });
  if (!previousInfo) {
    throw new NoDataError("Utilisateur introuvable.");
  }
  const subject = await assertCanEditMemberFullInfo(previousInfo.uuid);

  const data = memberInfoUpdateSchema.shape.member.parse(memberData);

  await updateMember(data, previousInfo.uuid, undefined, subject.username);

  const dbUser = await getUserInfos({
    username,
    options: { withDetails: true },
  });

  return {
    message: "Success",
    data: dbUser,
  };
}

export const updateMemberInfo = withErrorHandling(updateMemberInfoAction);

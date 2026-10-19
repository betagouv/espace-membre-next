"use server";

import { getServerSession } from "next-auth";

import { updateMember } from "@/app/api/member/updateMember";
import { canEditMemberFullInfo } from "@/lib/canEditMember";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { memberInfoUpdateSchema } from "@/models/actions/member";
import { authOptions } from "@/lib/authoptions";
import {
  AuthorizationError,
  NoDataError,
  withErrorHandling,
} from "@/lib/error";

async function updateMemberInfoAction({
  username,
  memberData,
}: {
  username: string;
  memberData: unknown;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }

  const previousInfo = await getUserInfos({ username });
  if (!previousInfo) {
    throw new NoDataError("Utilisateur introuvable.");
  }

  // a member can edit itself, admins and incubator team members can edit others
  const isCurrentUser = session.user.id === username;
  if (
    !isCurrentUser &&
    !(await canEditMemberFullInfo({
      memberUuid: previousInfo.uuid,
      sessionUser: session.user,
    }))
  ) {
    throw new AuthorizationError();
  }

  const data = memberInfoUpdateSchema.shape.member.parse(memberData);

  await updateMember(data, previousInfo.uuid, undefined, session.user.id);

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

import { MemberPageProps } from "@/components/MemberPage/MemberPage";
import { userInfos } from "@/lib/utils";
import { canEditMember as _canEditMember } from "@/lib/canEditMember";
import { canValidateRestrictedChecklistItem } from "@/lib/canValidateRestrictedChecklistItem";
import { getUserChecklists } from "@/lib/checklists/getUserChecklists";
import {
  getUserStartups,
  getUserIncubators,
  getUserBasicInfo,
} from "@/lib/kysely/queries/users";
import { getEventListByUsername } from "@/lib/events";
import { getAvatarUrl } from "@/lib/s3";
import { db } from "@/lib/kysely";
import { memberChangeToModel, memberBaseInfoToModel } from "@/models/mapper";
import type { Session } from "next-auth";

type PageContext = {
  session: Session;
  memberId: string;
  isCurrentUser: boolean;
};

export async function buildMemberPageProps({
  session,
  memberId,
  isCurrentUser,
}: PageContext): Promise<MemberPageProps> {
  const [user, dbUser] = await Promise.all([
    userInfos({ username: memberId }, isCurrentUser),
    getUserBasicInfo({ username: memberId }),
  ]);

  if (!dbUser) {
    throw new Error("Cannot find user");
  }

  const baseInfo = memberBaseInfoToModel(dbUser);

  const [
    changes,
    avatar,
    startups,
    matrixAccount,
    { onboarding, offboarding },
    incubators,
  ] = await Promise.all([
    getEventListByUsername(memberId).then((events) =>
      events.map(memberChangeToModel),
    ),
    getAvatarUrl(dbUser.username),
    getUserStartups(dbUser.uuid),
    db
      .selectFrom("matrix_accounts")
      .select("matrix_id")
      .where("user_id", "=", dbUser.uuid)
      .executeTakeFirst(),
    getUserChecklists(user.userInfos.uuid, baseInfo.domaine),
    getUserIncubators(dbUser.uuid),
  ]);

  const isAdmin = !!session.user.isAdmin;
  const canEditMember = isCurrentUser
    ? true
    : await _canEditMember({
        memberUuid: user.userInfos.uuid,
        sessionUser: session.user,
      });

  const canValidateMember =
    canEditMember && session.user.uuid !== user.userInfos.uuid;

  const canValidateRestrictedItems = await canValidateRestrictedChecklistItem(
    session.user,
  );

  return {
    isAdmin,
    isCurrentUser,
    canEditMember,
    canValidateMember,
    canValidateRestrictedItems,
    authorizations: user.authorizations,
    emailInfos: user.emailInfos,
    emailRedirections: user.emailRedirections,
    isExpired: user.isExpired,
    avatar,
    changes,
    userInfos: baseInfo,
    matrixId: matrixAccount?.matrix_id,
    startups,
    onboarding,
    offboarding,
    incubators,
  };
}

import { MemberPageProps } from "@/components/MemberPage/MemberPage";
import { userInfos } from "@/lib/utils";
import {
  canEditMember as _canEditMember,
  canViewMemberApiKeys,
} from "@/lib/authorization/member";
import { toAuthSubject } from "@/lib/authorization/subject";
import { isApiKeyCreationDisabled } from "@/server/config/apiKeys.config";
import { toApiKeyRow } from "@/lib/api-keys/listItem";
import { apiKeyPerimeterOptions } from "@/lib/api-keys/perimeterOptions";
import { listPersonalApiKeys } from "@/lib/kysely/queries/apiKeys";
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
  // Visibilite isCurrentUser || isAdmin, PAS canEditMember : un membre d'equipe
  // qui peut editer une fiche n'a aucune raison de voir les clefs personnelles
  // de ce membre.
  const subject = toAuthSubject(session)!;
  const canSeeApiKeys = canViewMemberApiKeys(subject, dbUser.uuid);
  const apiKeys = canSeeApiKeys
    ? (await listPersonalApiKeys(dbUser.uuid)).map(toApiKeyRow)
    : [];
  // Candidats decrivant le PORTEUR, droits d'ecriture evalues sur le SUJET :
  // c'est ce que fait assertPerimetersAllowed, un admin creant une clef pour
  // quelqu'un d'autre agit avec ses propres droits.
  const perimeterOptions = canSeeApiKeys
    ? await apiKeyPerimeterOptions(subject, dbUser.uuid)
    : { read: { incubators: [], startups: [] }, write: { incubators: [], startups: [] } };
  const canEditMember = isCurrentUser
    ? true
    : await _canEditMember({
        memberUuid: user.userInfos.uuid,
        sessionUser: session.user,
      });

  const canValidateMember =
    canEditMember && session.user.uuid !== user.userInfos.uuid;

  return {
    isAdmin,
    isCurrentUser,
    canEditMember,
    canValidateMember,
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
    canSeeApiKeys,
    apiKeys,
    perimeterOptions,
    apiKeyCreationDisabled: isApiKeyCreationDisabled(),
  };
}

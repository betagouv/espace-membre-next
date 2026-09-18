import { AuthorizationError } from "@/lib/error";
import { isIncubatorTeamMember } from "@/lib/kysely/queries/authorization";
import { ApiPerimeter } from "@/models/api/perimeter";
import { isApiKeyCreationDisabled } from "@/server/config/apiKeys.config";

import { isIncubatorLead } from "./incubator";
import { canEditStartup } from "./startup";
import { AuthSubject, requireAuthSubject } from "./subject";

/** Lecture libre pour tout membre, perimetre global inclus, sans verification. */
export function canUseReadPerimeter(_subject: AuthSubject, _p: ApiPerimeter) {
  return true;
}

/** Ecriture sur son propre perimetre. Global reserve aux admins. */
export async function canUseWritePerimeter(
  subject: AuthSubject,
  perimeter: ApiPerimeter,
): Promise<boolean> {
  if (perimeter.kind === "global") return subject.isAdmin;
  if (subject.isAdmin) return true;
  if (perimeter.kind === "incubator") {
    return isIncubatorTeamMember(subject.uuid, perimeter.uuid);
  }
  return canEditStartup(subject, perimeter.uuid);
}

/** Clefs d'application : admins et responsables d'incubateur. */
export async function canCreateServiceKey(
  subject: AuthSubject,
  incubatorUuid: string | null,
): Promise<boolean> {
  if (subject.isAdmin) return true;
  if (!incubatorUuid) return false; // organisation : admins seuls
  return isIncubatorLead(subject.uuid, incubatorUuid);
}

export function canCreatePersonalKey(subject: AuthSubject, ownerUuid: string) {
  return subject.isAdmin || subject.uuid === ownerUuid;
}

/**
 * Admins sur toute clef, porteur sur la sienne, responsables sur leur
 * incubateur. La branche du porteur est un elargissement delibere et borne aux
 * clefs personnelles : sans elle, un membre creerait une clef sans pouvoir la
 * retirer.
 */
export async function canRevokeApiKey(
  subject: AuthSubject,
  key: {
    kind: "personal" | "service";
    owner_user_id: string | null;
    owner_incubator_id: string | null;
  },
): Promise<boolean> {
  if (subject.isAdmin) return true;
  if (key.kind === "personal") return key.owner_user_id === subject.uuid;
  if (!key.owner_incubator_id) return false;
  return isIncubatorLead(subject.uuid, key.owner_incubator_id);
}

const assertCreationEnabled = () => {
  if (isApiKeyCreationDisabled()) {
    throw new AuthorizationError(
      "La creation de clefs d'API est temporairement desactivee.",
    );
  }
};

export async function assertCanCreatePersonalKey(ownerUuid: string) {
  assertCreationEnabled();
  const subject = await requireAuthSubject();
  if (!canCreatePersonalKey(subject, ownerUuid)) throw new AuthorizationError();
  return subject;
}

export async function assertCanCreateServiceKey(
  incubatorUuid: string | null,
) {
  assertCreationEnabled();
  const subject = await requireAuthSubject();
  if (!(await canCreateServiceKey(subject, incubatorUuid))) {
    throw new AuthorizationError();
  }
  return subject;
}

export async function assertCanRevokeApiKey(key: {
  kind: "personal" | "service";
  owner_user_id: string | null;
  owner_incubator_id: string | null;
}) {
  const subject = await requireAuthSubject();
  if (!(await canRevokeApiKey(subject, key))) throw new AuthorizationError();
  return subject;
}

export async function assertPerimetersAllowed(
  subject: AuthSubject,
  read: ApiPerimeter,
  write: ApiPerimeter | null,
) {
  if (!canUseReadPerimeter(subject, read)) throw new AuthorizationError();
  if (write && !(await canUseWritePerimeter(subject, write))) {
    throw new AuthorizationError(
      "Vous ne pouvez pas creer une clef d'ecriture sur ce perimetre.",
    );
  }
}

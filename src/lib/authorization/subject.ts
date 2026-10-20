import { getServerSession } from "next-auth";
import type { Session } from "next-auth";

import { authOptions } from "@/lib/authoptions";
import { AdminAuthorizationError, AuthorizationError } from "@/lib/error";

export type AuthSubject = {
  uuid: string;
  username: string;
  isAdmin: boolean;
};

export function toAuthSubject(session: Session | null): AuthSubject | null {
  if (!session?.user?.id || !session.user.uuid) return null;
  return {
    uuid: session.user.uuid,
    username: session.user.id,
    isAdmin: !!session.user.isAdmin,
  };
}

export async function getAuthSubject(): Promise<AuthSubject | null> {
  return toAuthSubject(await getServerSession(authOptions));
}

export async function requireAuthSubject(): Promise<AuthSubject> {
  const subject = await getAuthSubject();
  if (!subject) throw new AuthorizationError();
  return subject;
}

export async function requireAdmin(): Promise<AuthSubject> {
  const subject = await requireAuthSubject();
  if (!subject.isAdmin) throw new AdminAuthorizationError();
  return subject;
}

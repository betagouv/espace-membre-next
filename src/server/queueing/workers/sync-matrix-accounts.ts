import PgBoss from "pg-boss";
import { db } from "@/lib/kysely";
import { isPublicServiceEmail } from "@/lib/utils";
import { lookupMatrixIdsByEmails } from "@/lib/matrix/client";

export const syncMatrixAccountsTopic = "sync-matrix-accounts";

type UserRow = {
  primary_email: string | null;
  secondary_email: string | null;
  dinum_emails: string[] | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function getCandidateEmails(user: UserRow): Promise<string[]> {
  const candidates: string[] = [];
  const primaryEmail = user.primary_email
    ? normalizeEmail(user.primary_email)
    : null;
  const secondaryEmail = user.secondary_email
    ? normalizeEmail(user.secondary_email)
    : null;

  if (primaryEmail && (await isPublicServiceEmail(primaryEmail))) {
    candidates.push(primaryEmail);
    if (
      primaryEmail.endsWith("@beta.gouv.fr") &&
      !primaryEmail.includes(".ext@beta")
    ) {
      candidates.push(
        primaryEmail.replace("@beta.gouv.fr", ".ext@beta.gouv.fr"),
      );
    }
  }
  if (secondaryEmail && (await isPublicServiceEmail(secondaryEmail))) {
    candidates.push(secondaryEmail);
  }
  candidates.push(...(user.dinum_emails ?? []).map(normalizeEmail));
  return candidates;
}

function firstMatch(
  emails: string[],
  emailToMatrixId: Map<string, string>,
): string | undefined {
  return emails.map((e) => emailToMatrixId.get(e)).find(Boolean);
}

export async function syncMatrixAccounts(job: PgBoss.Job<void>) {
  // select all active users emails
  const users = await db
    .selectFrom("users")
    .leftJoin("dinum_emails", "dinum_emails.user_id", "users.uuid")
    .leftJoin("missions", "missions.user_id", "users.uuid")
    .select((eb) => [
      "users.uuid",
      "users.primary_email",
      "users.secondary_email",
      eb.fn
        .agg<string[]>("array_agg", [eb.ref("dinum_emails.email")])
        .filterWhere("dinum_emails.email", "is not", null)
        .distinct()
        .as("dinum_emails"),
    ])
    .where("missions.end", ">=", new Date())
    .groupBy(["users.uuid", "users.primary_email", "users.secondary_email"])
    .execute();

  console.log(`sync-matrix-accounts: ${users.length} users loaded`);

  const userCandidates: { userId: string; emails: string[] }[] = [];
  for (const user of users) {
    const emails = await getCandidateEmails(user);
    if (emails.length > 0) userCandidates.push({ userId: user.uuid, emails });
  }

  console.log(
    `sync-matrix-accounts: ${userCandidates.length}/${users.length} users have candidate emails`,
  );

  const uniqueEmails = [...new Set(userCandidates.flatMap((u) => u.emails))];
  console.log(
    `sync-matrix-accounts: looking up ${uniqueEmails.length} unique emails`,
  );

  const emailToMatrixId = await lookupMatrixIdsByEmails(uniqueEmails);
  console.log(
    `sync-matrix-accounts: ${emailToMatrixId.size}/${uniqueEmails.length} emails matched a Matrix account`,
  );

  const upserts = userCandidates.flatMap(({ userId, emails }) => {
    const matrixId = firstMatch(emails, emailToMatrixId);
    return matrixId ? [{ user_id: userId, matrix_id: matrixId }] : [];
  });

  if (upserts.length > 0) {
    await db
      .insertInto("matrix_accounts")
      .values(upserts)
      .onConflict((c) =>
        c.column("user_id").doUpdateSet({
          matrix_id: (eb) => eb.ref("excluded.matrix_id"),
          updated_at: (eb) => eb.fn("now"),
        }),
      )
      .execute();
  }

  console.log(
    `sync-matrix-accounts: done — ${upserts.length} accounts upserted`,
  );
}

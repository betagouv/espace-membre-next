/**
 * Test the matrix sync for a single user identified by email.
 *
 * Usage:
 *   npm run job:sync-matrix-account-single -- <email>
 * or directly:
 *   NODE_OPTIONS='--import tsx/esm' npx tsx src/scripts/sync-matrix-account-single.ts <email>
 *
 * Prints candidate emails, the Matrix lookup result, and what would be upserted.
 * Does NOT write to the database.
 */

import { db } from "@/lib/kysely";
import { isPublicServiceEmail } from "@/server/controllers/utils";
import { lookupMatrixIdsByEmails } from "@/lib/matrix/client";

const targetEmail = process.argv[2];

if (!targetEmail) {
  console.error("Usage: sync-matrix-account-single.ts <email>");
  process.exit(1);
}

async function getCandidateEmails(user: {
  primary_email: string | null;
  secondary_email: string | null;
  dinum_emails: string[] | null;
}): Promise<string[]> {
  const candidates: string[] = [];
  if (user.primary_email && (await isPublicServiceEmail(user.primary_email))) {
    candidates.push(user.primary_email);
    if (
      user.primary_email.endsWith("@beta.gouv.fr") &&
      !user.primary_email.includes(".ext@beta")
    ) {
      candidates.push(
        user.primary_email.replace("@beta.gouv.fr", ".ext@beta.gouv.fr"),
      );
    }
  }
  if (
    user.secondary_email &&
    (await isPublicServiceEmail(user.secondary_email))
  ) {
    candidates.push(user.secondary_email);
  }
  candidates.push(...(user.dinum_emails ?? []));
  return candidates;
}

async function main() {
  const user = await db
    .selectFrom("users")
    .leftJoin("dinum_emails", "dinum_emails.user_id", "users.uuid")
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
    .where((eb) =>
      eb.or([
        eb("users.primary_email", "=", targetEmail),
        eb("users.secondary_email", "=", targetEmail),
      ]),
    )
    .groupBy(["users.uuid", "users.primary_email", "users.secondary_email"])
    .executeTakeFirst();

  if (!user) {
    console.error(`No user found with email: ${targetEmail}`);
    process.exit(1);
  }

  console.log(`User found: ${user.uuid}`);
  console.log(`  primary_email:   ${user.primary_email ?? "(none)"}`);
  console.log(`  secondary_email: ${user.secondary_email ?? "(none)"}`);
  console.log(`  dinum_emails:    ${(user.dinum_emails ?? []).join(", ") || "(none)"}`);

  const candidates = await getCandidateEmails(user);
  console.log(`\nCandidate emails for Matrix lookup (${candidates.length}):`);
  for (const e of candidates) console.log(`  - ${e}`);

  if (candidates.length === 0) {
    console.log("\nNo candidate emails — nothing to look up.");
    return;
  }

  console.log("\nLooking up candidates in Matrix identity server...");
  const emailToMatrixId = await lookupMatrixIdsByEmails(candidates);

  if (emailToMatrixId.size === 0) {
    console.log("No Matrix accounts found for any candidate email.");
    return;
  }

  console.log(`\nMatrix matches (${emailToMatrixId.size}):`);
  for (const [email, matrixId] of emailToMatrixId.entries()) {
    console.log(`  ${email} => ${matrixId}`);
  }

  const matrixId = candidates.map((e) => emailToMatrixId.get(e)).find(Boolean);
  if (matrixId) {
    console.log(`\nWould upsert: user_id=${user.uuid}  matrix_id=${matrixId}`);
  } else {
    console.log("\nNo match — nothing would be upserted.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

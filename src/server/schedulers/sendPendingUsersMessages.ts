import { db } from "@/lib/kysely";
import { sql } from "kysely";
import pAll from "p-all";
import { sendEmail } from "../config/email.config";
import { EMAIL_TYPES } from "../modules/email";
import { EmailStatusCode } from "@/models/member";

export async function sendPendingUsersMessages() {
  // pour les utilisateur créés dans les dernieres 24h
  await sendPendingUsersMessagesForIncubators({ days: 7 });
  await sendPendingUsersMessagesForMembers({ days: 7 });
  // pour les utilisateur créés il y a 7J
  await sendPendingUsersMessagesForIncubators({ days: 7 });
  await sendPendingUsersMessagesForMembers({ days: 7 });
}

/**
 * send notification to users that:
 *  - have none verified their email account
 *  - have been created in the last 30 days
 */
export async function sendPendingUsersMessagesForMembers({
  days,
}: {
  days: number;
}) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const waitingVerificationMembers = await db
    .selectFrom("users")
    .where("secondary_email", "is not", null)
    .where(
      "primary_email_status",
      "=",
      EmailStatusCode.EMAIL_VERIFICATION_WAITING
    )
    .where(
      sql`DATE(created_at)`,
      "=",
      sql`CURRENT_DATE - INTERVAL '${days} days'`
    )
    .select(["username", "fullname", "secondary_email"])
    .execute();
  console.log(
    `sendPendingUsersMessagesForMembers: sending to ${waitingVerificationMembers.length} members`
  );
  return pAll(
    waitingVerificationMembers.map((member) => () => {
      if (member.secondary_email) {
        console.log(
          `sendPendingUsersMessagesForMembers: sending to ${member.secondary_email}`
        );
        return sendEmail({
          toEmail: [member.secondary_email],
          type: EMAIL_TYPES.EMAIL_VERIFICATION_WAITING_RAISE,
          forceTemplate: true,
          variables: {
            fullname: member.fullname,
          },
        });
      }
      return Promise.resolve();
    }),
    { concurrency: 1 }
  );
}

/**
 * send notification to incubators members for new members pending validations:
 *  - users in `MEMBER_VALIDATION_WAITING` from the incubator startups
 *  - users in `MEMBER_VALIDATION_WAITING` from the incubator internal teams
 *  - that have been created in the last 30 days
 */

export async function sendPendingUsersMessagesForIncubators({
  days,
}: {
  days: number;
}) {
  // relance aux incubateurs pour les MEMBER_VALIDATION_WAITING
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const waitingValidationUsers = db
    .selectFrom("users")
    .where(
      "primary_email_status",
      "=",
      EmailStatusCode.MEMBER_VALIDATION_WAITING
    )
    .where((eb) => eb("users.created_at", ">=", thirtyDaysAgo));

  // membres en attente dans les startups
  const startupMembersQuery = waitingValidationUsers
    .innerJoin("missions", "missions.user_id", "users.uuid")
    .innerJoin(
      "missions_startups",
      "missions_startups.mission_id",
      "missions.uuid"
    )
    .innerJoin(
      "startups",
      "missions_startups.startup_id",
      "missions_startups.startup_id"
    )
    .select([
      "users.username",
      "users.fullname",
      "startups.name as startup",
      "startups.incubator_id",
    ]);

  const startupMembers = await startupMembersQuery.execute();

  // membre en attente dans les équipes incubateur
  const incubatorMembers = await waitingValidationUsers
    .innerJoin("users_teams", "users_teams.user_id", "users.uuid")
    .innerJoin("teams", "teams.uuid", "users_teams.team_id")
    .select(["users.username", "users.fullname", "teams.incubator_id"])
    .execute();

  const allPendingMembers = [...startupMembers, ...incubatorMembers];

  // liste des incubateurs à prévenir
  const destinationIncubatorsIds = Array.from(
    new Set(...allPendingMembers.map((u) => u.incubator_id))
  );

  if (destinationIncubatorsIds.length) {
    // membres des incubateurs à prévenir
    const destinationMembers = await db
      .selectFrom("users")
      .innerJoin("users_teams", "users_teams.user_id", "users.uuid")
      .innerJoin("teams", "teams.uuid", "users_teams.team_id")
      .where("users.primary_email_status", "=", "EMAIL_ACTIVE")
      .where("primary_email", "is not", "null")
      .where("teams.incubator_id", "in", destinationIncubatorsIds)
      .select([
        "communication_email",
        "primary_email",
        "secondary_email",
        "teams.incubator_id",
      ])
      .distinct()
      .execute();

    // pour chaque membre de l'incubateur à prévenir:
    //  - envoi template brevo avec la liste des nouveaux members à valider
    console.log(
      `sendPendingUsersMessagesForIncubators: sending ${destinationMembers.length} notifications`
    );
    await pAll(
      destinationMembers.map((destinationMember) => () => {
        const incubatorPendingMembers = allPendingMembers.filter(
          (m) => m.incubator_id === destinationMember.incubator_id
        );
        if (incubatorPendingMembers.length) {
          const destinationMemberEmail =
            destinationMember.communication_email === "primary"
              ? destinationMember.primary_email
              : destinationMember.secondary_email;
          if (destinationMemberEmail) {
            console.log(
              `sendPendingUsersMessagesForIncubators: sending to ${destinationMemberEmail}`
            );
            return sendEmail({
              toEmail: [destinationMemberEmail],
              type: EMAIL_TYPES.EMAIL_VALIDATION_WAITING_RAISE,
              forceTemplate: true,
              variables: {
                pendingMembers: incubatorPendingMembers,
              },
            });
          }
        }
        return Promise.resolve();
      }),
      { concurrency: 1 }
    );
  }
}

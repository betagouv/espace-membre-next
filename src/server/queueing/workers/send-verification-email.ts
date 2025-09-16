import PgBoss from "pg-boss";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import {
  SendNewMemberVerificationEmailSchema,
  SendNewMemberVerificationEmailSchemaType,
} from "@/models/jobs/member";
import { sendOnboardingVerificationPendingEmailForUser } from "@/server/schedulers/emailScheduler";

export const sendNewMemberVerificationEmailTopic =
  "send-new-member-verification-email";

export async function sendNewMemberVerificationEmail(
  job: PgBoss.Job<SendNewMemberVerificationEmailSchemaType>,
) {
  // envoi du mail de verification
  const data = SendNewMemberVerificationEmailSchema.parse(job.data);
  const user = await getUserBasicInfo({ username: data.username }).then(
    (user) => user && memberBaseInfoToModel(user),
  );
  if (user) {
    sendOnboardingVerificationPendingEmailForUser(user);
  }
}

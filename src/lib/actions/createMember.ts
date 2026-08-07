"use server";

import slugify from "@sindresorhus/slugify";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserTeamsIncubators } from "@/lib/kysely/queries/incubators";
import { createMission } from "@/lib/kysely/queries/missions";
import { EventCode } from "@/models/actionEvent";
import {
  createMemberSchema,
  createMemberSchemaType,
} from "@/models/actions/member";
import {
  SendNewMemberValidationEmailSchema,
  SendNewMemberVerificationEmailSchema,
} from "@/models/jobs/member";
import { EmailStatusCode } from "@/models/member";
import { isPublicServiceEmail, isAdminEmail } from "@/lib/utils";
import { getBossClientInstance } from "@/server/queueing/client";
import { sendNewMemberValidationEmailTopic } from "@/server/queueing/workers/send-validation-email";
import { sendNewMemberVerificationEmailTopic } from "@/server/queueing/workers/send-verification-email";
import { authOptions } from "@/lib/authoptions";
import {
  AdminEmailNotAllowedError,
  AuthorizationError,
  MemberUniqueConstraintViolationError,
  withErrorHandling,
} from "@/lib/error";

const createUsername = (firstName: string, lastName: string) =>
  `${slugify(firstName)}.${slugify(lastName)}`;

async function getStartupIncubatorIds(
  userStartups: string[],
): Promise<string[]> {
  if (!userStartups.length) return [];
  const startupIncubators = await db
    .selectFrom("startups")
    .where("uuid", "in", userStartups)
    .selectAll()
    .execute();
  return startupIncubators
    .map((m) => m.incubator_id)
    .filter((incubator): incubator is string => !!incubator);
}

const isSessionUserMemberOfUserIncubatorTeams = async function (
  sessionUserUuid: string,
  userMissions: createMemberSchemaType["missions"],
  incubator_id: createMemberSchemaType["incubator_id"],
): Promise<boolean> {
  const sessionUserIncubatorIds = (await getUserTeamsIncubators(sessionUserUuid)).map(
    (incubator) => incubator.uuid,
  );
  const userStartups = userMissions.flatMap((m) => m.startups || []);
  const startupIncubatorIds = await getStartupIncubatorIds(userStartups);

  const incubatorIds = new Set(startupIncubatorIds);
  if (incubator_id) incubatorIds.add(incubator_id);

  return [...incubatorIds].some((el) => sessionUserIncubatorIds.includes(el));
};

async function createMemberAction(input: createMemberSchemaType) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthorizationError();
  }
  const { member, missions, incubator_id } = createMemberSchema.parse(input);
  const hasPublicServiceEmail = await isPublicServiceEmail(member.email);
  if (hasPublicServiceEmail && isAdminEmail(member.email)) {
    throw new AdminEmailNotAllowedError();
  }
  const username = createUsername(member.firstname, member.lastname);
  const sessionUserIsMemberOfUserIncubatorTeams =
    await isSessionUserMemberOfUserIncubatorTeams(
      session.user.uuid,
      missions,
      incubator_id,
    );
  try {
    const userIsValidatedStraightAway =
      sessionUserIsMemberOfUserIncubatorTeams || session.user.isAdmin;
    const dbUser = await db.transaction().execute(async (trx) => {
      const user = await trx
        .insertInto("users")
        .values({
          domaine: member.domaine,
          secondary_email: member.email,
          fullname: `${member.firstname} ${member.lastname}`,
          username,
          role: "",
          primary_email_status: userIsValidatedStraightAway
            ? EmailStatusCode.EMAIL_VERIFICATION_WAITING
            : EmailStatusCode.MEMBER_VALIDATION_WAITING,
        })
        .returning("uuid")
        .executeTakeFirstOrThrow();
      for (const mission of missions) {
        await createMission(
          {
            ...mission,
            user_id: user.uuid,
          },
          trx,
        );
      }
      return user;
    });
    const bossClient = await getBossClientInstance();
    if (userIsValidatedStraightAway) {
      await bossClient.send(
        sendNewMemberVerificationEmailTopic,
        SendNewMemberVerificationEmailSchema.parse({
          userId: dbUser.uuid,
        }),
        {
          retryLimit: 5,
          retryBackoff: true,
        },
      );
    } else {
      await bossClient.send(
        sendNewMemberValidationEmailTopic,
        SendNewMemberValidationEmailSchema.parse({
          userId: dbUser.uuid,
          incubator_id,
        }),
        {
          retryLimit: 50,
          retryBackoff: true,
        },
      );
    }
    await addEvent({
      created_by_username: session.user.id,
      action_on_username: username,
      action_code: EventCode.MEMBER_CREATED,
      action_metadata: {
        member,
        missions,
        incubator_id,
      },
    });
    revalidatePath("/community", "layout");
    const response: createMemberResponseSchemaType = {
      uuid: dbUser.uuid,
      validated: userIsValidatedStraightAway,
    };
    return response;
  } catch (error: any) {
    if (
      error.message.includes("duplicate key value violates unique constraint")
    ) {
      throw new MemberUniqueConstraintViolationError(username);
    }
    throw error;
  }
}

export const createMember = withErrorHandling(createMemberAction);

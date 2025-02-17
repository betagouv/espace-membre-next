import slugify from "@sindresorhus/slugify";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserTeamsIncubators } from "@/lib/kysely/queries/incubators";
import { createMission } from "@/lib/kysely/queries/missions";
import { EventCode } from "@/models/actionEvent";
import {
    createMemberResponseSchemaType,
    createMemberSchema,
    createMemberSchemaType,
} from "@/models/actions/member";
import { SendNewMemberValidationEmailSchema } from "@/models/jobs/member";
import { EmailStatusCode } from "@/models/member";
import { isPublicServiceEmail, isAdminEmail } from "@/server/controllers/utils";
import { getBossClientInstance } from "@/server/queueing/client";
import { sendNewMemberValidationEmailTopic } from "@/server/queueing/workers/send-validation-email";
import { authOptions } from "@/utils/authoptions";
import {
    AdminEmailNotAllowedError,
    AuthorizationError,
    MemberUniqueConstraintViolationError,
    withHttpErrorHandling,
} from "@/utils/error";

const createUsername = (firstName, lastName) =>
    `${slugify(firstName)}.${slugify(lastName)}`;

const isSessionUserMemberOfUserIncubatorTeams = async function (
    sessionUserUuid: string,
    userMissions: createMemberSchemaType["missions"],
    incubator_id: createMemberSchemaType["incubator_id"]
): Promise<boolean> {
    const sessionUserIncubators = await getUserTeamsIncubators(sessionUserUuid);
    const sessionUserIncubatorIds = sessionUserIncubators.map(
        (incubator) => incubator.uuid
    );
    const userStartups = userMissions.flatMap((m) => m.startups || []);
    const startupIncubators = userStartups.length
        ? await db
              .selectFrom("startups")
              .where("uuid", "in", userStartups)
              .selectAll()
              .execute()
        : [];
    const startupIncubatorIds = startupIncubators
        .map((m) => m.incubator_id)
        .filter((incubator): incubator is string => !!incubator);

    const incubatorIds = Array.from(new Set([...startupIncubatorIds]));
    if (incubator_id && !incubatorIds.includes(incubator_id)) {
        incubatorIds.push(incubator_id);
    }

    return incubatorIds.some((el) => sessionUserIncubatorIds.includes(el));
};

export const POST = withHttpErrorHandling(async (req: Request) => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    const rawdata = await req.json();
    const { member, missions, incubator_id } =
        createMemberSchema.parse(rawdata);
    const hasPublicServiceEmail = await isPublicServiceEmail(member.email);
    if (hasPublicServiceEmail && isAdminEmail(member.email)) {
        throw new AdminEmailNotAllowedError();
    }
    const username = createUsername(member.firstname, member.lastname);
    const sessionUserIsMemberOfUserIncubatorTeams =
        await isSessionUserMemberOfUserIncubatorTeams(
            session.user.uuid,
            missions,
            incubator_id
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
                    // if session user is from incubator team, member is valided straight away
                    primary_email_status: userIsValidatedStraightAway
                        ? EmailStatusCode.EMAIL_VERIFICATION_WAITING
                        : EmailStatusCode.MEMBER_VALIDATION_WAITING,
                })
                .returning("uuid")
                .executeTakeFirstOrThrow();
            for (const mission of missions) {
                // Now, use the same transaction to link to an organization
                await createMission(
                    {
                        ...mission,
                        user_id: user.uuid,
                    },
                    trx
                );
            }
            return user;
        });
        if (!userIsValidatedStraightAway) {
            // send validation email
            const bossClient = await getBossClientInstance();
            await bossClient.send(
                sendNewMemberValidationEmailTopic,
                SendNewMemberValidationEmailSchema.parse({
                    userId: dbUser.uuid,
                    incubator_id,
                }),
                {
                    retryLimit: 50,
                    retryBackoff: true,
                }
            );
        }
        await addEvent({
            created_by_username: session.user.id,
            action_on_username: dbUser.username,
            action_code: EventCode.MEMBER_CREATED,
            action_metadata: {
                member,
                missions,
                incubator_id,
            },
        });
        let response: createMemberResponseSchemaType = {
            uuid: dbUser.uuid,
            validated: userIsValidatedStraightAway,
        };
        revalidatePath("/community", "layout");
        return Response.json(response);
    } catch (error: any) {
        if (
            error.message.includes(
                "duplicate key value violates unique constraint"
            )
        ) {
            // Handle unique constraint violation
            throw new MemberUniqueConstraintViolationError(username);
        }
        // Handle other potential errors (logging, rethrowing, etc.)
        console.error("Unexpected error:", error);
        throw error;
    }
});

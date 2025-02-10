import slugify from "@sindresorhus/slugify";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserTeamsIncubators } from "@/lib/kysely/queries/incubators";
import { createMission } from "@/lib/kysely/queries/missions";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { EventCode } from "@/models/actionEvent";
import {
    createMemberSchema,
    createMemberSchemaType,
} from "@/models/actions/member";
import { SendNewMemberValidationEmailSchema } from "@/models/jobs/member";
import { EmailStatusCode } from "@/models/member";
import { isSessionUserIncubatorTeamAdminForUser } from "@/server/config/admin.config";
import { isPublicServiceEmail, isAdminEmail } from "@/server/controllers/utils";
import { getBossClientInstance } from "@/server/queueing/client";
import {
    sendNewMemberValidationEmail,
    sendNewMemberValidationEmailTopic,
} from "@/server/queueing/workers/send-validation-email";
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
    userMissions: createMemberSchemaType["missions"]
): Promise<boolean> {
    const sessionUserIncubators = await getUserTeamsIncubators(sessionUserUuid);
    const sessionUserIncubatorIds = sessionUserIncubators.map(
        (incubator) => incubator.uuid
    );
    const userStartups = userMissions.flatMap((m) => m.startups || []);
    const startupIncubators = await db
        .selectFrom("startups")
        .where("startups.uuid", "in", userStartups)
        .selectAll()
        .execute();
    // todo incubator_id might change to be another params send in object "job"
    const missionIncubatorIds = userMissions
        .map((m) => m.incubator_id)
        .filter((incubator): incubator is string => !!incubator);
    const startupIncubatorIds = startupIncubators
        .map((m) => m.incubator_id)
        .filter((incubator): incubator is string => !!incubator);

    const incubatorIds = Array.from(
        new Set([...missionIncubatorIds, ...startupIncubatorIds])
    );

    return incubatorIds.some((el) => sessionUserIncubatorIds.includes(el));
};

export const POST = withHttpErrorHandling(async (req: Request) => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    const rawdata = await req.json();
    const { member, missions } = createMemberSchema.parse(rawdata);
    const hasPublicServiceEmail = await isPublicServiceEmail(member.email);
    if (hasPublicServiceEmail && isAdminEmail(member.email)) {
        throw new AdminEmailNotAllowedError();
    }
    const username = createUsername(member.firstname, member.lastname);
    const sessionUserIsMemberOfUserIncubatorTeams =
        await isSessionUserMemberOfUserIncubatorTeams(
            session.user.uuid,
            missions
        );
    let dbUser;
    try {
        dbUser = await db
            .transaction()
            .execute(async (trx) => {
                const user = await trx
                    .insertInto("users")
                    .values({
                        domaine: member.domaine,
                        secondary_email: member.email,
                        fullname: `${member.firstname} ${member.lastname}`,
                        username,
                        role: "",
                        // if session user is from incubator team, member is valided straight away
                        primary_email_status:
                            sessionUserIsMemberOfUserIncubatorTeams ||
                            session.user.isAdmin
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
            })
            .then(async (res) => {
                const dbUser = await getUserInfos({
                    uuid: res.uuid,
                    options: { withDetails: true },
                });
                revalidatePath("/community", "layout");
                return dbUser;
            });
        if (
            !(sessionUserIsMemberOfUserIncubatorTeams || session.user.isAdmin)
        ) {
            // send validation email
            const bossClient = await getBossClientInstance();
            await bossClient.send(
                sendNewMemberValidationEmailTopic,
                SendNewMemberValidationEmailSchema.parse({
                    userId: dbUser.uuid,
                })
            );
        }
        await addEvent({
            created_by_username: session.user.id,
            action_on_username: dbUser.uuid,
            action_code: EventCode.MEMBER_CREATED,
            action_metadata: {
                member,
                missions,
            },
        });
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
    return Response.json(dbUser);
});

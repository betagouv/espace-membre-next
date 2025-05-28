import slugify from "@sindresorhus/slugify";
import PgBoss from "pg-boss";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getStartup } from "@/lib/kysely/queries";
import { generateSentryTeamSlug, teamAlreadyExistsError } from "@/lib/sentry";
import { EventCode } from "@/models/actionEvent";
import { CreateSentryTeamDataSchemaType } from "@/models/jobs/services";
import { SERVICES } from "@/models/services";
import { sentryClient } from "@/server/config/sentry.config";
import { NoDataError } from "@/utils/error";

export const createSentryTeamTopic = "create-sentry-team";

export async function createSentryTeam(
    job: PgBoss.Job<CreateSentryTeamDataSchemaType>,
) {
    console.log(`Create sentry team for ${job.data.email}`, job.id, job.name);

    const startup = await getStartup({ uuid: job.data.startupId });
    if (!startup) {
        throw new NoDataError();
    }
    const team = {
        teamName: startup.name,
        teamSlug: generateSentryTeamSlug(startup.name),
    };
    try {
        const resp = await sentryClient.createSentryTeam(team);
        await db
            .insertInto("sentry_teams")
            .values({
                name: resp.name,
                sentry_id: resp.id,
                startup_id: job.data.startupId,
                slug: team.teamSlug,
            })
            .execute();

        await addEvent({
            action_code: EventCode.MEMBER_SERVICE_TEAM_CREATED,
            action_metadata: {
                service: SERVICES.SENTRY,
                startupId: job.data.startupId,
                team,
                requestId: job.data.requestId,
                jobId: job.id,
            },
            action_on_username: job.data.username,
            created_by_username: job.data.username,
        });
        console.log(`l'équipe a été créé ${team.teamName}`);
    } catch (error) {
        if (error === teamAlreadyExistsError) {
            console.log(`l'équipe ${team.teamName} existe déjà`);
        } else {
            throw error;
        }
    }
}

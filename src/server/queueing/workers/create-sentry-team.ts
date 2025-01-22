import pAll from "p-all";
import PgBoss from "pg-boss";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getStartup } from "@/lib/kysely/queries";
import { EventCode } from "@/models/actionEvent";
import { CreateSentryTeamDataSchemaType } from "@/models/jobs/services";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { sentryClient } from "@/server/config/sentry.config";
import { NoDataError } from "@/utils/error";

export const createSentryTeamTopic = "create-sentry-team";

export async function createSentryTeam(
    job: PgBoss.Job<CreateSentryTeamDataSchemaType>
) {
    console.log(`Create sentry team for ${job.data.email}`, job.id, job.name);

    const startup = await getStartup({ uuid: job.data.startupId });
    if (!startup) {
        throw new NoDataError();
    }
    const team = {
        teamName: startup.name,
        teamSlug: startup.ghid,
    };
    await sentryClient.createSentryTeam(team);

    await addEvent({
        action_code: EventCode.MEMBER_SERVICE_TEAM_CREATED,
        action_metadata: {
            service: SERVICES.SENTRY,
            startupId: job.data.startupId,
            team,
            requestId: job.data.requestId,
        },
        action_on_username: job.data.username,
        created_by_username: job.data.username,
    });

    console.log(`the sentry account has been created for ${job.data.username}`);
}

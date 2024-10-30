import PgBoss from "pg-boss";

import { createUser, getTeam } from "@/lib/mattermost";
import {
    CreateMattermostAccountDataSchema,
    CreateMattermostAccountDataSchemaType,
} from "@/models/jobs/services";
import config from "@/server/config";

export const createMattermostServiceAccountTopic =
    "create-mattermost-service-account";

export async function createMattermostServiceAccount(
    job: PgBoss.Job<CreateMattermostAccountDataSchemaType>
) {
    const data = CreateMattermostAccountDataSchema.parse(job.data);
    // const mattermostTeam: { invite_id: string } = await getTeam(
    //     config.mattermostTeamId
    // );
    // await createUser(
    //     {
    //         email: data.email,
    //         username: data.username,
    //         password: data.password,
    //         position: data.position,
    //     },
    //     mattermostTeam.invite_id
    // );

    console.log(
        `the user account has been created for the case ${data.username}`
    );
}

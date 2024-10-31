"use server";

import { match } from "ts-pattern";

import { db } from "@/lib/kysely";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import { CreateMattermostAccountDataSchema } from "@/models/jobs/services";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { getBossClientInstance } from "@/server/queueing/client";
import { createMattermostServiceAccountTopic } from "@/server/queueing/workers/create-mattermost-account";
import { NoDataError, ValidationError, withErrorHandling } from "@/utils/error";

export const askAccountCreationForService = withErrorHandling(
    async ({
        userUuid,
        service,
        password,
    }: {
        userUuid: string;
        service: SERVICES;
        password: string;
    }) => {
        // create task
        const bossClient = await getBossClientInstance();
        const user = await getUserBasicInfo({ uuid: userUuid });
        const startups = await getUserStartups(userUuid);
        if (!user) throw new NoDataError("User count not be found");
        match(service).with(SERVICES.MATTERMOST, async () => {
            if (!user.primary_email) {
                throw new ValidationError("Un email primaire est obligatoire");
            }
            await db
                .insertInto("service_accounts")
                .values({
                    user_id: user.uuid,
                    service_user_id: user.username,
                    account_type: SERVICES.MATTERMOST,
                    status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
                })
                .execute();
            await bossClient.send(
                createMattermostServiceAccountTopic,
                CreateMattermostAccountDataSchema.parse({
                    email: user.primary_email,
                    username: user.username,
                    password: password,
                    position: `${user.role} @ ${startups
                        .map((s) => s.name)
                        .join(",")}`,
                }),
                {
                    retryLimit: 50,
                    retryBackoff: true,
                }
            );
        });
    }
);

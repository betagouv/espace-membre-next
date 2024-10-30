"use server";

import Email from "next-auth/providers/email";
import { match } from "ts-pattern";

import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import { CreateMattermostAccountDataSchema } from "@/models/jobs/services";
import { SERVICES } from "@/server/config/services.config";
import { getBossClientInstance } from "@/server/queueing/client";
import { createMattermostServiceAccountTopic } from "@/server/queueing/workers/create-mattermost-account";
import { NoDataError, withErrorHandling } from "@/utils/error";

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

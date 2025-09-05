"use server";

import { getServerSession } from "next-auth";
import { getBossClientInstance } from "@/server/queueing/client";
import { createDimailMailboxTopic } from "@/server/queueing/workers/create-dimail-mailbox";
import { authOptions } from "@/utils/authoptions";
import { AuthorizationError, withErrorHandling } from "@/utils/error";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";

export const createDimailEmail = withErrorHandling(async (userUuid: string) => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }

  const dbUser = await getUserBasicInfo({ uuid: userUuid });
  if (!dbUser) {
    throw new Error(`User ${userUuid} not found`);
  }
  const user = memberBaseInfoToModel(dbUser);

  const bossClient = await getBossClientInstance();
  await bossClient.send(
    createDimailMailboxTopic,
    {
      userUuid: user.uuid,
      username: user.username,
    },
    {
      retryLimit: 50,
      retryBackoff: true,
    },
  );

  return { success: true };
});

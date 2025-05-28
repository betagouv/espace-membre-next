"use server";

import { getServerSession } from "next-auth/next";

import { getMattermostUsers } from "@/server/controllers/adminController";
import { authOptions } from "@/utils/authoptions";
import {
  AuthorizationError,
  UnwrapPromise,
  withErrorHandling,
} from "@/utils/error";
import { getUserWithParams, sendInfoToChat } from "@infra/chat";

const sendMessageToChannel = async ({
  channel,
  text,
}: {
  channel: string;
  text: string;
}) => {
  await sendInfoToChat({
    text: text,
    channel,
  });
};

const sendDirectMessageToUsers = async ({
  fromBeta,
  text,
  excludeEmails,
  includeEmails,
}: {
  fromBeta: boolean;
  text: string;
  excludeEmails: string[];
  includeEmails: string[];
}) => {
  const activeUsers = await getMattermostUsers({
    fromBeta,
    includeEmails,
    excludeEmails,
  });
  console.log(`Will send message to ${activeUsers.length}`);
  let nbUsers = 0;
  for (const user of activeUsers) {
    console.log(`Will write to user`, user.username);
    try {
      await sendInfoToChat({
        text: text,
        username: user.username,
        channel: "secretariat",
        extra: {
          username: "Equipe Communauté beta.gouv",
        },
      });
      nbUsers++;
    } catch (e) {}
  }
  return {
    nbUsers,
  };
};

export const sendMessageToUsersOnChat = async ({
  text,
  fromBeta,
  excludeEmails,
  includeEmails,
  channel,
  prod,
}: {
  text: string;
  fromBeta: boolean;
  excludeEmails?: string[];
  includeEmails?: string[];
  channel?: string;
  prod?: boolean;
}) => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError(
      `You don't have the right to access this function`,
    );
  }
  if (!session.user.isAdmin) {
    throw new AuthorizationError(`L'utilisateur doit être administrateur`);
  }
  let nbUsers;
  if (prod) {
    if (channel) {
      await sendMessageToChannel({
        text,
        channel,
      });
    } else {
      console.log("will send direct message to users");
      nbUsers = await sendDirectMessageToUsers({
        text,
        fromBeta,
        excludeEmails: excludeEmails || [],
        includeEmails: includeEmails || [],
      }).then((res) => res.nbUsers);
    }
  }
  // send message to admin
  await sendInfoToChat({
    text: text,
    username: session.user.id,
    channel: "secretariat",
    extra: {
      username: "Equipe Communauté beta.gouv",
    },
  });
  return {
    message: `Envoyé un message en ${prod ? "prod" : "test"} à ${
      nbUsers !== undefined ? nbUsers : channel
    }`,
  };
};

export const safeSendMessageToUsersOnChat = withErrorHandling<
  UnwrapPromise<ReturnType<typeof sendMessageToUsersOnChat>>,
  Parameters<typeof sendMessageToUsersOnChat>
>(sendMessageToUsersOnChat);

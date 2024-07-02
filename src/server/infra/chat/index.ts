import { makeSendIntoToChatFromMattermost } from "./mattermost";
import * as mattermost from "@/lib/mattermost";
import { MattermostUser } from "@/lib/mattermost";
import config from "@/server/config";

export const sendInfoToChat = makeSendIntoToChatFromMattermost({
    config: {
        WEBHOOK_GENERAL: config.CHAT_WEBHOOK_URL_GENERAL,
        WEBHOOK_SECRETARIAT: config.CHAT_WEBHOOK_URL_SECRETARIAT,
        WEBHOOK_DINUM_CENTREVILLE: config.CHAT_WEBHOOK_URL_DINUM,
        WEBHOOK_GIP: config.CHAT_WEBHOOK_URL_GIP,
    },
});

export const getAllChannels =
    process.env.NODE_ENV === "development"
        ? async () => {
              return Promise.resolve([
                  { name: "Test1", display_name: "test1" },
                  { name: "town-square", display_name: "test2" },
              ]);
          }
        : mattermost.getAllChannels;

export const getUserWithParams: (
    params?: any,
    i?: number
) => Promise<MattermostUser[]> =
    process.env.NODE_ENV === "development"
        ? async (params, i) => {
              return Promise.resolve([
                  {
                      email: "firstname.lastname@incubateur.net",
                      username: "firstname.lastname",
                  } as MattermostUser,
                  {
                      email: "firstname.lastname.toto@incubateur.net",
                      username: "firstname.lastname.toto",
                  } as MattermostUser,
                  {
                      email: `julien.dauphant@${config.domain}`,
                      username: "julien.dauphant",
                  } as MattermostUser,
              ]);
          }
        : mattermost.getUserWithParams;

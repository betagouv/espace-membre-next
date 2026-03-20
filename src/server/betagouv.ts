import axios from "axios";

import { getDimailEmail } from "@/lib/kysely/queries/dimail";
import { Job, JobWTTJ } from "@/models/job";
import { memberBaseInfoToModel, userInfosToModel } from "@/models/mapper";
import { memberBaseInfoSchemaType, EmailInfos } from "@/models/member";
import { EMAIL_PLAN_TYPE, OvhRedirection } from "@/models/ovh";
import config from "@/server/config";

const betaGouv = {
  sendInfoToChat: async (
    text: string,
    channel?: string,
    username?: string,
    hookURL?: string,
  ) => {
    const params: any = {
      text,
      channel: channel === "general" ? "town-square" : channel,
    };
    if (!hookURL) {
      hookURL = config.CHAT_WEBHOOK_URL_SECRETARIAT!;
      if (channel === "general") {
        hookURL = config.CHAT_WEBHOOK_URL_GENERAL!;
      } else if (channel === "dinum") {
        hookURL = config.CHAT_WEBHOOK_URL_DINUM!;
      } else if (channel && channel !== "secretariat") {
        hookURL = config.CHAT_WEBHOOK_URL_GENERAL!;
      }
    }
    if (username) {
      params.channel = `@${username}`;
    }
    try {
      return await axios.post(hookURL, params);
    } catch (err) {
      throw new Error(`Error to notify slack: ${err}`);
    }
  },

  getJobsWTTJ: async (): Promise<JobWTTJ[]> => {
    return await axios
      .get(config.JOBS_WTTJ_API!)
      .then((res) => res.data.jobs)
      .catch((err) => {
        throw new Error(`Error to get jobs infos : ${err}`);
      });
  },

  emailInfos: async (id: string): Promise<EmailInfos | null> => {
    const email = `${id}@${config.domain}`;
    const dimailEmail = await getDimailEmail(email);
    if (dimailEmail) {
      return {
        email,
        emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI,
        isBlocked: false,
      };
    }
    return null;
  },

  // Mailing list methods — stubbed pending n8n migration
  getAllMailingList: async (): Promise<string[] | null> => {
    console.log("Mailing list sync disabled, pending n8n migration");
    return null;
  },
  createMailingList: async (_mailingListName: string) => {
    console.log("Mailing list sync disabled, pending n8n migration");
    return null;
  },
  unsubscribeFromMailingList: async (
    _mailingListName: string,
    _email: string,
  ) => {
    console.log("Mailing list sync disabled, pending n8n migration");
    return null;
  },
  subscribeToMailingList: async (
    _mailingListName: string,
    _email: string,
  ): Promise<null> => {
    console.log("Mailing list sync disabled, pending n8n migration");
    return null;
  },
  getMailingListSubscribers: async (_mailingListName: string): Promise<string[]> => {
    console.log("Mailing list sync disabled, pending n8n migration");
    return [];
  },

  // Redirection methods — no-ops (OVH removed)
  redirectionsForId: async (
    _query:
      | { from: string; to?: string }
      | { from?: string; to: string },
  ): Promise<OvhRedirection[]> => {
    return [];
  },
};

const beta = betaGouv;
export default beta;

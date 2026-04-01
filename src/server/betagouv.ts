import axios from "axios";

import { getDimailEmail } from "@/lib/kysely/queries/dimail";
import { JobWTTJ } from "@/models/job";
import { EmailInfos, EMAIL_PLAN_TYPE } from "@/models/member";
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
};

const beta = betaGouv;
export default beta;

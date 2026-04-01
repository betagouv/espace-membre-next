import axios from "axios";

import { getDimailEmail } from "@/lib/kysely/queries/dimail";
import { EmailInfos, EMAIL_PLAN_TYPE } from "@/models/member";
import config from "@/server/config";

const betaGouv = {
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

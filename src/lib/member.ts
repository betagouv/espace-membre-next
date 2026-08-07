import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

import { memberSchemaType, EmailInfos, EMAIL_PLAN_TYPE } from "@/models/member";
import { missionSchemaType } from "@/models/mission";
import { getDimailEmail } from "@/lib/kysely/queries/dimail";
import config from "@/lib/config";

export async function emailInfos(id: string): Promise<EmailInfos | null> {
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
}

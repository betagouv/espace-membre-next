import axios from "axios";
import { isAfter, isBefore } from "date-fns";
import { NextRequest } from "next/server";

import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import config from "@/server/config";
import {
  smtpBlockedContactsEmailDelete,
  unblacklistContactEmail,
} from "@/server/infra/email/sendInBlue";

interface ISibWebhookBody {
  event:
    | "soft_bounce"
    | "hard_bounce"
    | "blocked"
    | "invalid_email"
    | "error"
    | "unsubscribed";
  email: string;
  id: number;
  "message-id": string;
  timestamp: number;
  ts_event: number;
  date: string;
  subject: string;
  template_id: number;
  tags: string[];
}

const hasActiveMissions = (missions) => {
  const now = new Date();
  return missions.find(
    (mission) =>
      isAfter(now, mission.start ?? 0) &&
      isBefore(now, mission.end ?? Infinity),
  );
};

async function unblockFromBrevoIfNecessary(email) {
  const user = await getUserBasicInfo({ primary_email: email });
  if (hasActiveMissions(user?.missions)) {
    await smtpBlockedContactsEmailDelete(email);
    await unblacklistContactEmail(email);
  }
}

async function handleMattermostWebhook(sibWebhookBody: ISibWebhookBody) {
  const message = `:toolbox: Webhook send in blue\n
    email: ${sibWebhookBody.email}
    statut de l'email : ${sibWebhookBody.event}
    webhook_id: ${sibWebhookBody.id}
    message_id: ${sibWebhookBody["message-id"]}
    date: ${sibWebhookBody.date}
    subjet: ${sibWebhookBody.subject}
    tags: ${sibWebhookBody.tags}
`;
  if (
    !sibWebhookBody.subject ||
    sibWebhookBody.subject.includes("New Notification")
  ) {
    return;
  }
  await axios.post(
    `https://mattermost.incubateur.net/hooks/${config.SIB_WEBHOOK_ID}`,
    { text: message },
  );
  if (sibWebhookBody.subject.includes("Réinitialisez votre mot de passe")) {
    await unblockFromBrevoIfNecessary(sibWebhookBody.email);
  }
}

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  if (id === config.SIB_WEBHOOK_ID) {
    let sibWebhookBody = (await req.json()) as ISibWebhookBody;
    handleMattermostWebhook(sibWebhookBody);
  }
  return Response.json({ success: true });
};

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
            isBefore(now, mission.end ?? Infinity)
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
    if (sibWebhookBody.subject.includes("New Notification")) {
        return;
    }
    await axios.post(
        `https://mattermost.incubateur.net/hooks/${config.SIB_WEBHOOK_ID}`,
        { text: message }
    );
    if (sibWebhookBody.subject.includes("Réinitialisez votre mot de passe")) {
        await unblockFromBrevoIfNecessary(sibWebhookBody.email);
    }
}

export const POST = async (
    req: NextRequest,
    { params: { id } }: { params: { id: string } }
) => {
    if (id === config.SIB_WEBHOOK_ID) {
        let sibWebhookBody = (await req.json()) as ISibWebhookBody;
        handleMattermostWebhook(sibWebhookBody);
    } else if (id === config.CHATWOOT_ID) {
        let conversationId = "";
        const body = await req.json();
        try {
            conversationId = body.id;
        } catch (e) {
            console.error("Could not get conversation Id");
        }
        if (
            config.CHATWOOT_IGNORE_EMAILS &&
            config.CHATWOOT_IGNORE_EMAILS.includes(body.meta.sender.email)
        ) {
            console.log(`Ignore message from ${body.meta.sender.email}`);
            return;
        }
        const message = `:toolbox: Nouvelle demande de support de ${
            body.meta.sender.email
        } : ${body.messages.map((m) => m.content).join("/n")}
https://chatwoot.incubateur.net/app/accounts/1/inbox/1/conversations/${conversationId}
      `;
        console.log(`Post message : `, message); // Call your action on the request here
        await axios.post(
            `https://mattermost.incubateur.net/hooks/${config.CHATWOOT_ID}`,
            { text: message }
        );
    } else if (id === config.CHATWOOT_BADGE_ID) {
        let conversationId = "";
        const body = await req.json();
        try {
            conversationId = body.id;
        } catch (e) {
            console.error("Could not get conversation Id");
        }
        const message = `:toolbox: Nouvelle demande de badge de ${
            body.meta.sender.email
        } : ${body.messages.map((m) => m.content).join("/n")}
https://chatwoot.incubateur.net/app/accounts/1/inbox/1/conversations/${conversationId}
      `;
        console.log(`Post message : `, message); // Call your action on the request here
        await axios.post(
            `https://mattermost.incubateur.net/hooks/${config.CHATWOOT_BADGE_ID}`,
            { text: message }
        );
    }
    return Response.json({ success: true });
};

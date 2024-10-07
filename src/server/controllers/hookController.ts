import axios from "axios";

import config from "@/server/config";

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

export const postToHook = async (req, res) => {
    if (req.params.hookId === config.MATTERMOST_WEBHOOK_PING) {
        await axios.post(
            `https://mattermost.incubateur.net/hooks/${config.MATTERMOST_WEBHOOK_PING}`,
            { text: `${config.MATTERMOST_TEAM_PING}` }
        );
    } else if (req.params.hookId === config.SIB_WEBHOOK_ID) {
        let sibWebhookBody = req.body as ISibWebhookBody;

        const message = `:toolbox: Webhook send in blue\n
    email: ${sibWebhookBody.email}
    statut de l'email : ${sibWebhookBody.event}
    webhook_id: ${sibWebhookBody.id}
    message_id: ${sibWebhookBody["message-id"]}
    date: ${sibWebhookBody.date}
    sujet: ${sibWebhookBody.subject}
    tags: ${sibWebhookBody.tags}
`;
        await axios.post(
            `https://mattermost.incubateur.net/hooks/${config.SIB_WEBHOOK_ID}`,
            { text: message }
        );
    } else if (req.params.hookId === config.CHATWOOT_ID) {
        let conversationId = "";
        try {
            conversationId = req.body.id;
        } catch (e) {
            console.error("Could not get conversation Id");
        }
        if (
            config.CHATWOOT_IGNORE_EMAILS &&
            config.CHATWOOT_IGNORE_EMAILS.includes(req.body.meta.sender.email)
        ) {
            console.log(`Ignore message from ${req.body.meta.sender.email}`);
            return;
        }
        const message = `:toolbox: Nouvelle demande de support de ${
            req.body.meta.sender.email
        } : ${req.body.messages.map((m) => m.content).join("/n")}
https://chatwoot.incubateur.net/app/accounts/1/inbox/1/conversations/${conversationId}
      `;
        console.log(`Post message : `, message); // Call your action on the request here
        await axios.post(
            `https://mattermost.incubateur.net/hooks/${config.CHATWOOT_ID}`,
            { text: message }
        );
    } else if (req.params.hookId === config.CHATWOOT_BADGE_ID) {
        let conversationId = "";
        try {
            conversationId = req.body.id;
        } catch (e) {
            console.error("Could not get conversation Id");
        }
        const message = `:toolbox: Nouvelle demande de badge de ${
            req.body.meta.sender.email
        } : ${req.body.messages.map((m) => m.content).join("/n")}
https://chatwoot.incubateur.net/app/accounts/1/inbox/1/conversations/${conversationId}
      `;
        console.log(`Post message : `, message); // Call your action on the request here
        await axios.post(
            `https://mattermost.incubateur.net/hooks/${config.CHATWOOT_BADGE_ID}`,
            { text: message }
        );
    }
};

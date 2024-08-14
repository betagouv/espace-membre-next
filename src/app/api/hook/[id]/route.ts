import axios from "axios";
import { NextRequest } from "next/server";

import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { getUserByEmail } from "@/lib/mattermost";
import {
    memberPublicInfoToModel,
    memberBaseInfoToModel,
} from "@/models/mapper";
import config from "@/server/config";
import { checkUserIsExpired, userInfos } from "@/server/controllers/utils";
import { sendInfoToChat } from "@/server/infra/chat";

type SIBEvent =
    | "soft_bounce"
    | "hard_bounce"
    | "blocked"
    | "invalid_email"
    | "error"
    | "unsubscribed";

interface ISibWebhookBody {
    event: SIBEvent;
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

export const fixBounceEmail = async ({ email, id }: ISibWebhookBody) => {
    if (config.SIB_TECH_WEBHOOK_ID && id === config.SIB_TECH_WEBHOOK_ID) {
        // the identified case is a mattermost notification that has bounced
        try {
            const member = await userInfos({ email }, false);
            if (!member.emailInfos?.email) {
                const mattermostUser = await getUserByEmail(email);
                await sendInfoToChat({
                    username: mattermostUser.username,
                    text: `Bonjour, 
                    il semble que l'adresse liée à ton compte mattermost n'existe plus (${email}), l'email est classé en "Hardbounce".
                    \n
                    Si en effet il s'agit d'une ancienne adresse, tu peux changer ton adresse en cliquant sur ta photo de profile, puis dans profile > Email.
                    Ta nouvelle adresse doit être une adresse de service publique.
                    Il faut ensuite cliquer sur le lien envoyé par email par mattermost pour valider ton changement d'adresse.
                    \n
                    Si ton adresse est censée existée, tu peux faire une demande ops via le formulaire en header du canal ~incubateur-demandes-ops (le mot de passe est indiqué dans le header) et faire une demande de type "Mon email bounce".`,
                });
            }
        } catch (e) {
            return "User not found";
        }
    }
};

export const POST = async (
    req: NextRequest,
    { params: { id } }: { params: { id: string } }
) => {
    if (id === config.SIB_WEBHOOK_ID) {
        let sibWebhookBody = (await req.json()) as ISibWebhookBody;

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
        await fixBounceEmail(sibWebhookBody);
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

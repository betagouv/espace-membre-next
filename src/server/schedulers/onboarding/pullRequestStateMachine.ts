import * as Sentry from "@sentry/node";
import { differenceInDays } from "date-fns/differenceInDays";

import { Startups } from "@/@types/db";
import * as github from "@/lib/github";
import { db } from "@/lib/kysely";
import * as mattermost from "@/lib/mattermost";
import { CommunicationEmailCode } from "@/models/member";
import config from "@/server/config";
import { sendEmail } from "@/server/config/email.config";
import { sendInfoToChat } from "@infra/chat";
import { EMAIL_TYPES } from "@modules/email";
import htmlBuilder from "@modules/htmlbuilder/htmlbuilder";

async function sendMessageToReferent({
    prUrl,
    prInfo,
}: {
    prUrl: string;
    prInfo: {
        referent: string;
        name: string;
        isEmailBetaAsked: boolean;
    };
}) {
    const referent = prInfo.referent;
    const name = prInfo.name;
    const isEmailBetaAsked = prInfo.isEmailBetaAsked;
    try {
        const dbReferent = await db
            .selectFrom("users")
            .selectAll()
            .where("username", "=", prInfo.referent)
            .executeTakeFirstOrThrow();
        const email =
            dbReferent.communication_email ===
                CommunicationEmailCode.SECONDARY && dbReferent.secondary_email
                ? dbReferent.secondary_email
                : dbReferent.primary_email;
        if (email) {
            await sendEmail({
                toEmail: [email],
                type: EMAIL_TYPES.ONBOARDING_REFERENT_EMAIL,
                variables: {
                    referent,
                    prUrl,
                    name,
                    isEmailBetaAsked,
                    isSentViaEmail: true,
                },
            });
        }
    } catch (e) {
        Sentry.captureException(e);
        // user has a github card but is not in database
    }
    try {
        const [mattermostUser]: mattermost.MattermostUser[] =
            await mattermost.searchUsers({
                term: referent,
            });
        const messageContent = await htmlBuilder.renderContentForTypeAsMarkdown(
            {
                type: EMAIL_TYPES.ONBOARDING_REFERENT_EMAIL,
                variables: {
                    referent,
                    prUrl,
                    name,
                    isEmailBetaAsked,
                    isSentViaEmail: false,
                },
            }
        );
        await sendInfoToChat({
            text: messageContent,
            channel: "secretariat",
            username: mattermostUser.username,
        });
    } catch (e) {
        Sentry.captureException(e);
        console.error(
            "It was not able to send message to referent on mattermost",
            e
        );
    }
}

const sendEmailToTeam = async ({
    prUrl,
    prInfo: { referent, name, isEmailBetaAsked, startup },
    username,
}: {
    prUrl: string;
    prInfo: {
        referent: string;
        name: string;
        isEmailBetaAsked: boolean;
        startup?: string;
    };
    username: string;
}) => {
    if (!startup) {
        return;
    }
    const dbStartup = await db
        .selectFrom("startups")
        .selectAll()
        .where("ghid", "=", startup)
        .where("mailing_list", "is not", null)
        .executeTakeFirst();
    if (dbStartup) {
        await sendEmail({
            toEmail: [`${dbStartup.mailing_list!}@${config.domain}`],
            type: EMAIL_TYPES.EMAIL_NEW_MEMBER_PR,
            variables: {
                prUrl,
                name,
                isEmailBetaAsked,
                startup,
            },
        });
    }
};

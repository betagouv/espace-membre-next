import { generateMailingListName } from ".";
import { getAllStartups } from "@/lib/kysely/queries";
import { getUserByStartup } from "@/lib/kysely/queries/users";
import { CommunicationEmailCode, DBUser } from "@/models/dbUser";
import { startupToModel } from "@/models/mapper";
import { memberPublicInfoSchema } from "@/models/member";
import {
    ACTIVE_PHASES,
    StartupPhase,
    phaseSchemaType,
    startupSchemaType,
} from "@/models/startup";
import betagouv from "@betagouv";
import db from "@db";

function getCurrentPhase(startup: startupSchemaType): StartupPhase | undefined {
    return startup.phases
        ? startup.phases[startup.phases.length - 1].name
        : undefined;
}

const createMailingListForStartup = async (startup: startupSchemaType) => {
    const mailingListName = generateMailingListName(startup);
    return betagouv.createMailingList(mailingListName);
};

const addAndRemoveMemberToMailingListForStartup = async (
    startup: startupSchemaType
) => {
    const mailingListName = generateMailingListName(startup);
    const startupMembers = (await getUserByStartup(startup.uuid)).map(
        (user) => {
            return memberPublicInfoSchema.parse(user);
        }
    );
    const emails = startupMembers
        .map((dbUser) => {
            let email = dbUser.primary_email;
            if (
                dbUser.communication_email ===
                    CommunicationEmailCode.SECONDARY &&
                dbUser.secondary_email
            ) {
                email = dbUser.secondary_email;
            }
            return email;
        })
        .filter((email) => email) as string[];
    const subscribers = await betagouv.getMailingListSubscribers(
        mailingListName
    );
    console.log(`Subscriber in ${mailingListName} : ${subscribers.length}`);
    for (const email of emails.filter(
        (email) => !subscribers.includes(email)
    )) {
        betagouv.subscribeToMailingList(mailingListName, email);
    }
    for (const subscriber of subscribers.filter(
        (subscriber) => !emails.includes(subscriber)
    )) {
        betagouv.unsubscribeFromMailingList(mailingListName, subscriber);
    }
};

export const createMailingListForStartups = async () => {
    const mailingLists = (await betagouv.getAllMailingList()) || [];
    const startupDetails = (await getAllStartups()).map((startup) =>
        startupToModel(startup)
    );
    console.log(`Will create ${startupDetails.length} mailing lists`);
    for (const startup of startupDetails) {
        const phase = getCurrentPhase(startup);
        if (phase && ACTIVE_PHASES.includes(phase)) {
            try {
                if (!mailingLists.includes(generateMailingListName(startup))) {
                    await createMailingListForStartup(startup);
                }
                await db("startups")
                    .where({
                        id: startup.id,
                    })
                    .update({
                        mailing_list: generateMailingListName(startup),
                    });
                await addAndRemoveMemberToMailingListForStartup(startup);
                console.log(
                    `Create mailing list for : ${generateMailingListName(
                        startup
                    )}`
                );
            } catch (e) {
                console.error(e);
            }
        }
    }
};

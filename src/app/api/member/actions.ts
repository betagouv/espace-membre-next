"use server";

import { getServerSession } from "next-auth/next";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent";
import { UpdateOvhResponder } from "@/models/actions/ovh";
import { CommunicationEmailCode } from "@/models/member";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import {
    updateContactEmail,
    addContactsToMailingLists,
    removeContactsFromMailingList,
} from "@/server/config/email.config";
import { capitalizeWords, requiredError } from "@/server/controllers/utils";
import { isValidDate } from "@/server/controllers/validator";
import { Contact, MAILING_LIST_TYPE } from "@/server/modules/email";
import { authOptions } from "@/utils/authoptions";

export async function changeSecondaryEmailForUser(
    secondary_email: string,
    username: string
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    if (
        !config.ESPACE_MEMBRE_ADMIN.includes(session.user.id) &&
        session.user.id != username
    ) {
        throw new Error(`You are not allowed to execute this function`);
    }
    const user = await db
        .selectFrom("users")
        .select("secondary_email")
        .where("username", "=", username)
        .executeTakeFirst();
    if (!user) {
        throw new Error("Users not found");
    }
    await db
        .updateTable("users")
        .set({
            secondary_email,
        })
        .where("username", "=", username)
        .execute();
    addEvent({
        action_code: EventCode.MEMBER_SECONDARY_EMAIL_UPDATED,
        created_by_username: session.user.id,
        action_on_username: username,
        action_metadata: {
            value: secondary_email,
            old_value: user.secondary_email || "",
        },
    });
}

export async function updateCommunicationEmail(
    communication_email: CommunicationEmailCode
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    const dbUser = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", session.user.id)
        .executeTakeFirst();
    if (!dbUser) {
        throw new Error(`You don't have the right to access this function`);
    }
    let previousCommunicationEmail = dbUser.communication_email;
    let hasBothEmailsSet = dbUser.primary_email && dbUser.secondary_email;
    if (communication_email != previousCommunicationEmail && hasBothEmailsSet) {
        await db
            .updateTable("users")
            .set({
                communication_email,
            })
            .where("username", "=", session.user.id)
            .execute();
        await addEvent({
            action_code: EventCode.MEMBER_COMMUNICATION_EMAIL_UPDATE,
            created_by_username: session.user.id,
            action_on_username: session.user.id,
            action_metadata: {
                value: communication_email,
                old_value: dbUser
                    ? (dbUser.communication_email as CommunicationEmailCode)
                    : undefined,
            },
        });
        const newEmail =
            communication_email === CommunicationEmailCode.PRIMARY
                ? dbUser.primary_email
                : dbUser.secondary_email;
        const previousEmail =
            previousCommunicationEmail === CommunicationEmailCode.PRIMARY
                ? dbUser.primary_email
                : dbUser.secondary_email;
        await changeContactEmail(previousEmail, {
            email: newEmail as string,
            firstname: capitalizeWords(dbUser.username.split(".")[0]),
            lastname: capitalizeWords(dbUser.username.split(".")[1]),
        });
    }
}

async function changeContactEmail(previousEmail, contact: Contact) {
    if (config.FEATURE_SIB_USE_UPDATE_CONTACT_EMAIL) {
        await updateContactEmail({
            previousEmail,
            newEmail: contact.email,
        });
    } else {
        await addContactsToMailingLists({
            contacts: [contact],
            listTypes: [MAILING_LIST_TYPE.NEWSLETTER],
        });
        await removeContactsFromMailingList({
            emails: [previousEmail],
            listType: MAILING_LIST_TYPE.NEWSLETTER,
        });
    }
}

export async function setEmailResponderHandler({
    content,
    from,
    to,
}: UpdateOvhResponder) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }

    if (to && from < to) {
        throw new Error(
            "nouvelle date de fin : la date doit être supérieure à la date de début"
        );
    }

    const responder = await betagouv.getResponder(session.user.id);
    if (!responder) {
        await betagouv.setResponder(session.user.id, {
            from,
            to,
            content,
        });
        addEvent({
            action_code: EventCode.MEMBER_RESPONDER_CREATED,
            created_by_username: session.user.id,
            action_on_username: session.user.id,
            action_metadata: {
                value: content,
            },
        });
    } else {
        await betagouv.updateResponder(session.user.id, {
            from,
            to,
            content,
        });
        addEvent({
            action_code: EventCode.MEMBER_RESPONDER_UPDATED,
            created_by_username: session.user.id,
            action_on_username: session.user.id,
            action_metadata: {
                value: content,
                old_value: responder.content,
            },
        });
    }
}

export async function deleteResponder() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    await betagouv.deleteResponder(session.user.id);
    addEvent({
        action_code: EventCode.MEMBER_RESPONDER_DELETED,
        created_by_username: session.user.id,
        action_on_username: session.user.id,
    });
}

import { NextRequest } from "next/server";

import { memberBaseInfoToModel } from "@/models/mapper";
import { EmailStatusCode } from "@/models/member";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { buildBetaEmail, buildExtBetaEmail, checkUserIsExpired } from "@/server/controllers/utils";
import betagouv from "@/server/betagouv";
import _ from "lodash";
import { createEmailProviderService } from "@/server/config/emailProviderService";
import config from "@/server/config";
import { differenceUserOpiMailbox } from "@/server/controllers/usersController";


function existingUser(
    ovhAccountNames: string[],
    username: string,
) {
    return ovhAccountNames.includes(username);
};

function getFirstAndLastName(fullname: string) {
    const parts = fullname.trim().split(/\s+/);
    if (parts.length === 0) return { firstName: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };

    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(' ');
    return { firstName, lastName };
}

export const GET = async (req: NextRequest) => {

    const dbUsers = (await getAllUsersInfo()).map((user) =>
        memberBaseInfoToModel(user)
    );
    const concernedUsers = dbUsers.filter(
        (user) =>
            !checkUserIsExpired(user) &&
            [EmailStatusCode.EMAIL_ACTIF_CREATION_WAITING_AT_OPI, EmailStatusCode.EMAIL_CREATION_WAITING].includes(user.primary_email_status) &&
            !user.email_is_redirection &&
            user.secondary_email

    );
    const allOvhEmails: string[] = await betagouv.getAllEmailInfos();
    const emailService = createEmailProviderService()
    const opiMailboxes = await emailService.listMailbox(config.domain)
    const unregisteredUsers = _.differenceWith(
        concernedUsers,
        opiMailboxes,
        differenceUserOpiMailbox
    );
    console.log(
        `Email creation : ${unregisteredUsers.length} unregistered user(s) in OPI (${opiMailboxes.length} mailbox in OPI. ${concernedUsers.length} accounts in espace-membre bdd).`
    );
    return Response.json(unregisteredUsers.map(user => {
        const { firstName, lastName } = getFirstAndLastName(user.fullname)
        return {
            first_name: firstName,
            lastName: lastName,
            email: buildExtBetaEmail(user.username),
            alias: existingUser(allOvhEmails, user.username) ? buildBetaEmail(user.username) : null,
            secondary_email: user.secondary_email
        }
    }))
};

export const dynamic = "force-dynamic";

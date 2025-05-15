import { db } from "@/lib/kysely";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { userInfosToModel } from "@/models/mapper";
import { EmailStatusCode, memberBaseInfoSchemaType } from "@/models/member";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";
import config from "@/server/config";
import { sendEmail } from "@/server/config/email.config";
import { BusinessError } from "@/utils/error";
import betagouv from "@betagouv";
import * as utils from "@controllers/utils";
import { EMAIL_TYPES } from "@modules/email";

export async function setEmailActive(username) {
    const user = userInfosToModel(
        await getUserInfos({
            username: username,
            options: { withDetails: true },
        })
    );
    const shouldSendEmailCreatedEmail =
        user.primary_email_status === EmailStatusCode.EMAIL_CREATION_WAITING ||
        user.primary_email_status === EmailStatusCode.EMAIL_RECREATION_WAITING ||
        user.primary_email_status === EmailStatusCode.EMAIL_ACTIVE_AND_CREATION_WAITING_AT_OPI;
    console.log("should send email", shouldSendEmailCreatedEmail);

    await db
        .updateTable("users")
        .where("username", "=", username)
        .set({
            primary_email: utils.buildExtBetaEmail(username),
            primary_email_status:
                EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING, // email active but password must be define
            primary_email_status_updated_at: new Date(),
        })
        .execute();

    console.log(`Email actif pour ${user.username}`);
    if (shouldSendEmailCreatedEmail) {
        await sendEmailCreatedEmail(username);
    }
}

export async function setEmailRedirectionActive(username) {
    const user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", username)
        .executeTakeFirst();
    if (!user) {
        throw new Error(`L'utilisateur n'a pas été trouvé`);
    }
    await db
        .updateTable("users")
        .where("username", "=", username)
        .set({
            primary_email_status: EmailStatusCode.EMAIL_REDIRECTION_ACTIVE,
            primary_email_status_updated_at: new Date(),
        })
        .execute();
    console.log(`Email actif pour ${user.username}`);
}

export async function setEmailSuspended(username) {
    const user = await db
        .updateTable("users")
        .where("username", "=", username)
        .set({
            primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
            primary_email_status_updated_at: new Date(),
        })
        .execute();
    console.log(`Email suspendu pour ${username}`);
}

export async function sendEmailCreatedEmail(username) {
    const user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", username)
        .executeTakeFirst();
    let emailUrl = "https://mail.ovh.net/roundcube/";
    if (!user) {
        throw new Error(`L'utilisateur n'a pas été trouvé`);
    }
    try {
        const emailInfos = await betagouv.emailInfos(username);
        if (emailInfos?.emailPlan === EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO) {
            emailUrl = "https://pro1.mail.ovh.net/";
        } else if (
            emailInfos?.emailPlan === EMAIL_PLAN_TYPE.EMAIL_PLAN_EXCHANGE
        ) {
            emailUrl = "https://ex.mail.ovh.net/";
        }
    } catch (e) {
        // we ignore ovh api errors which is sometime down
        console.error(e);
    }
    const secretariatUrl = `${config.protocol}://${config.host}`;
    if (!user.primary_email) {
        throw new BusinessError(
            "UserHasNoPrimaryEmail",
            "User should have a primary email"
        );
    }
    if (!user.secondary_email) {
        throw new BusinessError(
            "UserHasNoSecondaryEmail",
            "User should have a secondary email"
        );
    }
    try {
        if (user?.secondary_email) {
            await sendEmail({
                type: EMAIL_TYPES.EMAIL_CREATED_EMAIL,
                toEmail: [user.secondary_email],
                variables: {
                    email: user.primary_email,
                    secondaryEmail: user.secondary_email,
                    secretariatUrl,
                    emailUrl,
                },
            });
        }
        console.log(`Email de bienvenue pour ${user.username} envoyé`);
    } catch (err) {
        throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
    }
}

export const differenceUserOpiMailbox = function differenceGithubOVH(
    user: memberBaseInfoSchemaType,
    opiMailbox: { email: string }
) {
    return utils.buildBetaEmail(user.username) === opiMailbox.email;
};

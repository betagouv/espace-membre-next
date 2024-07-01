import crypto from "crypto";

import { getActiveUsersUnregisteredOnMattermost } from ".";
import * as mattermost from "@/lib/mattermost";
import config from "@/server/config";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@modules/email";

export async function createUsersByEmail() {
    let activeUsersUnregisteredOnMattermost =
        await getActiveUsersUnregisteredOnMattermost();

    //todo check how many account will be created
    const mattermostTeam: { invite_id: string } = await mattermost.getTeam(
        config.mattermostTeamId
    );
    const results = await Promise.all(
        activeUsersUnregisteredOnMattermost.map(async (user) => {
            if (!user.primary_email) {
                return;
            }
            const email = user.primary_email;
            const password = crypto
                .randomBytes(20)
                .toString("base64")
                .slice(0, -2);
            try {
                await mattermost.createUser(
                    {
                        email,
                        username: user.username,
                        //todo add startup in the position
                        position: `${user.role}`,
                        // mattermost spec : password must contain at least 20 characters
                        password,
                    },
                    mattermostTeam.invite_id
                );

                await sendEmail({
                    toEmail: [email],
                    type: EMAIL_TYPES.EMAIL_MATTERMOST_ACCOUNT_CREATED,
                    variables: {
                        resetPasswordLink:
                            "https://mattermost.incubateur.net/reset_password",
                    },
                });
            } catch (err) {
                console.error(
                    "Erreur d'ajout des utilisateurs à mattermost",
                    err
                );
            }
        })
    );
    return results;
}

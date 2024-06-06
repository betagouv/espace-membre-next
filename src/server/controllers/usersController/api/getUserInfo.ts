import { db } from "@/lib/kysely";
import { getUserByEmail, MattermostUser, searchUsers } from "@/lib/mattermost";
import { memberPublicInfoToModel } from "@/models/mapper";
import { memberWrapperPublicInfoSchemaType } from "@/models/member";
import config from "@/server/config";
import * as utils from "@controllers/utils";

export async function getUserInfo(req, res) {
    const { username } = req.params;
    const isCurrentUser = req.auth ? req.auth.id === username : false;

    try {
        const user = await utils.userInfos(username, isCurrentUser);

        const hasGithubFile = user.userInfos;
        const hasEmailAddress =
            user.emailInfos || user.emailRedirections.length > 0;
        if (!hasGithubFile && !hasEmailAddress) {
            res.status(500).json({
                error: 'Il n\'y a pas de membres avec ce compte mail. Vous pouvez commencez par créer une fiche sur Github pour la personne <a href="/onboarding">en cliquant ici</a>.',
            });
        }
        const dbUser = await db
            .selectFrom("users")
            .selectAll()
            .where("username", "=", username)
            .executeTakeFirst();
        const secondaryEmail: string = dbUser?.secondary_email || "";
        let mattermostUser = dbUser?.primary_email
            ? await getUserByEmail(dbUser.primary_email).catch((e) => null)
            : null;
        let [mattermostUserInTeamAndActive]: MattermostUser[] =
            dbUser?.primary_email
                ? await searchUsers({
                      term: dbUser.primary_email,
                      team_id: config.mattermostTeamId,
                      allow_inactive: false,
                  }).catch((e) => [])
                : [];
        let data: memberWrapperPublicInfoSchemaType = {
            isExpired: user.isExpired,
            hasEmailInfos: !!user.emailInfos,
            isEmailBlocked: user.emailInfos?.isBlocked || false,
            hasSecondaryEmail: !!secondaryEmail,
            // canCreateEmail: user.authorizations.canCreateEmail || false,
            // emailInfos: req.auth?.id ? user.emailInfos : undefined,
            mattermostInfo: {
                hasMattermostAccount: !!mattermostUser,
                isInactiveOrNotInTeam: !mattermostUserInTeamAndActive,
            },
            userPublicInfos: memberPublicInfoToModel(user.userInfos),
        };
        res.json(data);
        // info public
        // userInfos: user.userInfos,
        // isExpired: user.isExpired,
        // hasEmailInfos: !!user.emailInfos,
        // isEmailBlocked: user.emailInfos?.isBlocked,
        // hasSecondaryEmail: !!secondaryEmail,
        // mattermostInfo: {
        //     hasMattermostAccount: !!mattermostUser,
        //     isInactiveOrNotInTeam: !mattermostUserInTeamAndActive,
        // },
        // primaryEmailStatus: dbUser
        //     ? dbUser.primary_email_status
        //     : EmailStatusCode.EMAIL_UNSET,
        // username,
        // // info filled if connected users
        // currentUserId: req.auth ? req.auth.id : undefined,
        // emailInfos: req.auth?.id ? user.emailInfos : undefined,
        // primaryEmail: req.auth?.id && dbUser ? dbUser.primary_email : "",
        // canCreateEmail: user.authorizations.canCreateEmail,
        // hasPublicServiceEmail: !dbUser?.primary_email?.includes(
        //     config.domain
        // ),
        // domain: config.domain,
        // secondaryEmail: req.auth?.id ? secondaryEmail : "",
        // });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Impossible de récupérer les informations du membre de la communauté.",
        });
    }
}

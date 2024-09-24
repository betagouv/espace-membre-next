import * as Sentry from "@sentry/node";
import { getServerSession } from "next-auth";

import { updateMember } from "../updateMember";
import {
    getUserBasicInfo,
    getUserInfos,
    updateUser,
} from "@/lib/kysely/queries/users";
import { MattermostUser, getUserByEmail, searchUsers } from "@/lib/mattermost";
import {
    memberInfoUpdateSchemaType,
    memberInfoUpdateSchema,
    memberValidateInfoSchema,
} from "@/models/actions/member";
import { EmailStatusCode } from "@/models/member";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import {
    isPublicServiceEmail,
    isAdminEmail,
    userInfos,
} from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import { AdminEmailNotAllowedError } from "@/utils/error";

const getMattermostUserInfo = async (
    dbUser
): Promise<{
    mattermostUser: MattermostUser | null;
    mattermostUserInTeamAndActive: boolean;
}> => {
    try {
        let mattermostUser = dbUser?.primary_email
            ? await getUserByEmail(dbUser.primary_email).catch((e) => null)
            : null;
        const [mattermostUserInTeamAndActive] = dbUser?.primary_email
            ? await searchUsers({
                  term: dbUser.primary_email,
                  team_id: config.mattermostTeamId,
                  allow_inactive: false,
              }).catch((e) => [])
            : [];
        return {
            mattermostUser,
            mattermostUserInTeamAndActive,
        };
    } catch (e) {
        Sentry.captureException(e);
        return {
            mattermostUser: null,
            mattermostUserInTeamAndActive: false,
        };
    }
};

export async function PUT(
    req: Request,
    { params: { username } }: { params: { username: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.id !== username) {
        throw new Error(`You don't have the right to access this function`);
    }
    const memberData = memberValidateInfoSchema.parse(await req.json());

    const hasPublicServiceEmail = await isPublicServiceEmail(
        memberData.secondary_email
    );
    if (hasPublicServiceEmail && !isAdminEmail(memberData.secondary_email)) {
        throw new AdminEmailNotAllowedError();
    }
    updateMember(
        memberData,
        session.user.uuid,
        {
            primary_email: hasPublicServiceEmail
                ? memberData.secondary_email
                : null,
            secondary_email: hasPublicServiceEmail
                ? null
                : memberData.secondary_email,
            primary_email_status: hasPublicServiceEmail
                ? EmailStatusCode.EMAIL_ACTIVE
                : EmailStatusCode.EMAIL_CREATION_WAITING,
        },
        session.user.id
    );

    const dbUser = await getUserInfos({
        username,
        options: { withDetails: true },
    });

    return Response.json({
        message: `Success`,
        data: dbUser,
    });
}

// export async function GET(
//     req: Request,
//     { params: { username } }: { params: { username: string } }
// ) {
//     const session = await getServerSession(authOptions);

//     if (!session || !session.user.id) {
//         throw new Error(`You don't have the right to access this function`);
//     }

// const isCurrentUser = session.user.id === username;
// try {
//     // todo not sure this call should send all user infos
//     const user = await userInfos({ username }, isCurrentUser);
//     const hasGithubFile = user.userInfos;
//     const hasEmailAddress =
//         user.emailInfos || user.emailRedirections.length > 0;
//     if (!hasGithubFile && !hasEmailAddress) {
//         throw new Error(
//             'Il n\'y a pas de membres avec ce compte mail. Vous pouvez <a href="/onboarding">créer la fiche de cette personne</a>.'
//         );
//     }

//         const dbUser = await getUserBasicInfo({ username });
//         const primaryEmail = dbUser ? dbUser.primary_email : "";
//         const secondaryEmail = dbUser ? dbUser.secondary_email : "";
//         let availableEmailPros: string[] = [];
//         if (config.ESPACE_MEMBRE_ADMIN.includes(session.user.id)) {
//             availableEmailPros = await betagouv.getAvailableProEmailInfos();
//         }
//         let { mattermostUser, mattermostUserInTeamAndActive } =
//             await getMattermostUserInfo(dbUser);
//         const title = user.userInfos ? user.userInfos.fullname : null;

//         return Response.json({
//             userBaseInfos: dbUser,
//             username,
//             emailInfos: user.emailInfos,
//             redirections: user.emailRedirections,
//             userInfos: user.userInfos,
//             isExpired: user.isExpired,
//             isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(session.user.id),
//             availableEmailPros,
//             mattermostInfo: {
//                 hasMattermostAccount: !!mattermostUser,
//                 isInactiveOrNotInTeam: !mattermostUserInTeamAndActive,
//             },
//             primaryEmail,
//             primaryEmailStatus: dbUser
//                 ? dbUser.primary_email_status
//                 : EmailStatusCode.EMAIL_UNSET,
//             canCreateEmail: user.authorizations.canCreateEmail,
//             hasPublicServiceEmail:
//                 dbUser &&
//                 dbUser.primary_email &&
//                 !dbUser.primary_email.includes(config.domain),
//             domain: config.domain,
//             secondaryEmail,
//         });
//     } catch (e) {}
// }

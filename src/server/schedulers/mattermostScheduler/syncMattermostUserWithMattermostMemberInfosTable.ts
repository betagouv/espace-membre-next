import { db } from "@/lib/kysely";
import * as mattermost from "@/lib/mattermost";
import { MattermostMemberInfo } from "@/models/mattermostMemberInfo";
import {
    memberBaseInfoSchemaType,
    memberPublicInfoSchemaType,
} from "@/models/member";
import config from "@/server/config";

const isSameUser = (
    mattermostUser: mattermost.MattermostUser,
    dbUser: {
        primary_email?: string | null;
        secondary_email?: string | null;
    },
) => {
    return (
        mattermostUser.email === dbUser.primary_email ||
        mattermostUser.email === dbUser.secondary_email
    );
};

export async function syncMattermostUserWithMattermostMemberInfosTable() {
    const mattermostUsers: mattermost.MattermostUser[] =
        await mattermost.getUserWithParams({
            in_team: config.mattermostTeamId,
            active: true,
        });
    const mattermostUserEmails: string[] = mattermostUsers.map(
        (user) => user.email,
    );
    const mattermostMemberInfos = await db
        .selectFrom("mattermost_member_infos")
        .selectAll()
        .execute();
    console.log("Mattermost users length", mattermostMemberInfos.length);
    // const dbUsers: DBUser[] = await db("users")
    //     .whereNotIn(
    //         "username",
    //         mattermostMemberInfos.map((m) => m.username)
    //     )
    //     .where((qb) => {
    //         qb.whereIn("secondary_email", mattermostUserEmails);
    //         qb.orWhereIn("primary_email", mattermostUserEmails);
    //     });
    const dbUsers = await db
        .selectFrom("users")
        .where(
            "username",
            "not in",
            mattermostMemberInfos.map((m) => m.username),
        )
        .where((eb) =>
            eb("secondary_email", "in", mattermostUserEmails).or(
                "primary_email",
                "in",
                mattermostUserEmails,
            ),
        )
        .selectAll()
        .execute();

    for (const dbUser of dbUsers) {
        const mattermostUser = mattermostUsers.find((mUser) =>
            isSameUser(mUser, dbUser),
        );
        if (mattermostUser) {
            const mattermostMemberInfo: MattermostMemberInfo = {
                username: dbUser.username,
                mattermost_user_id: mattermostUser.id,
            };
            await db
                .insertInto("mattermost_member_infos")
                .values(mattermostMemberInfo)
                .execute();
            console.log(`Ajoute ${dbUser.username} à la table mattermost`);
        }
    }
}

"use server";

import slugify from "@sindresorhus/slugify";
import _ from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { teamUpdateSchemaType } from "@/models/actions/team";
import { authOptions } from "@/utils/authoptions";

export async function updateTeam({
    teamWrapper: { team, members },
    teamUuid,
}: {
    teamWrapper: teamUpdateSchemaType;
    teamUuid: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    const previousTeamData = await db
        .selectFrom("teams")
        .selectAll()
        .where("uuid", "=", teamUuid)
        .executeTakeFirst();
    if (!previousTeamData) {
        throw new Error("Cannot find team");
    }

    await db.transaction().execute(async (trx) => {
        // update team data
        const incubator = await trx
            .selectFrom("incubators")
            .selectAll()
            .where("uuid", "=", team.incubator_id)
            .executeTakeFirst();
        await trx
            .updateTable("teams")
            .set({
                ...team,
                ghid:
                    team.name !== previousTeamData.name
                        ? slugify(`${incubator?.ghid}-${team.name}`)
                        : previousTeamData.ghid,
            })
            .where("uuid", "=", teamUuid)
            .execute();

        const res = await trx
            .deleteFrom("users_teams")
            .where("team_id", "=", teamUuid)
            .execute();
        const existingUsers = await trx
            .selectFrom("users")
            .select("uuid")
            .where("uuid", "in", members)
            .execute();
        if (members && members.length) {
            await trx
                .insertInto("users_teams")
                .values(
                    members.map((memberUuid) => {
                        return {
                            team_id: teamUuid,
                            user_id: memberUuid,
                        };
                    })
                )
                .execute();
        }

        revalidatePath("/teams");
    });
}

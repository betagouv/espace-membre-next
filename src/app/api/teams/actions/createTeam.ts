"use server";

import slugify from "@sindresorhus/slugify";
import _ from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { db } from "@/lib/kysely";
import { teamUpdateSchema, teamUpdateSchemaType } from "@/models/actions/team";
import { authOptions } from "@/utils/authoptions";

export async function createTeam({
    teamWrapper: { team, members },
}: {
    teamWrapper: teamUpdateSchemaType;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    teamUpdateSchema.parse({ team, members });
    await db.transaction().execute(async (trx) => {
        // update team data
        const incubator = await trx
            .selectFrom("incubators")
            .selectAll()
            .where("uuid", "=", team.incubator_id)
            .executeTakeFirst();
        const res = await trx
            .insertInto("teams")
            .values({
                ghid: slugify(`${incubator?.ghid}-${team.name}`),
                name: team.name,
                mission: team.mission,
                incubator_id: team.incubator_id,
            })
            .returning("uuid")
            .executeTakeFirst();
        if (res?.uuid) {
            await trx
                .insertInto("users_teams")
                .values(
                    members.map((memberUuid) => ({
                        team_id: res?.uuid,
                        user_id: memberUuid,
                    }))
                )
                .execute();
        }

        if (!res) {
            throw new Error("Team data could not be inserted into db");
        }

        revalidatePath("/teams");
    });
}

"use server";

import slugify from "@sindresorhus/slugify";
import _ from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";
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
            .returningAll()
            .executeTakeFirst();
        let memberIds: { uuid: string }[] = [];
        if (res?.uuid && members && members.length) {
            memberIds = await trx
                .insertInto("users_teams")
                .values(
                    members.map((memberUuid) => ({
                        team_id: res?.uuid,
                        user_id: memberUuid,
                    })),
                )
                .returning("uuid")
                .execute();
        }

        if (!res) {
            throw new Error("Team data could not be inserted into db");
        }

        revalidatePath("/teams");

        await addEvent({
            action_code: EventCode.TEAM_CREATED,
            created_by_username: session.user.id,
            action_metadata: {
                value: {
                    uuid: res.uuid,
                    ghid: res.ghid,
                    name: res.name,
                    mission: encodeURIComponent(res.mission || ""),
                    incubator_id: res.incubator_id,
                    memberIds: memberIds.map((m) => m.uuid),
                },
            },
        });
    });
}

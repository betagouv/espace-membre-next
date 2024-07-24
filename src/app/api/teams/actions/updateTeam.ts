"use server";

import slugify from "@sindresorhus/slugify";
import _ from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { teamUpdateSchemaType } from "@/models/actions/team";
import { authOptions } from "@/utils/authoptions";

export async function updateTeam({
    team,
    teamUuid,
}: {
    team: teamUpdateSchemaType;
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

        revalidatePath("/teams");
    });
}

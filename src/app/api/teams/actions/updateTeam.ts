"use server";

import slugify from "@sindresorhus/slugify";
import _ from "lodash";
import { revalidatePath } from "next/cache";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { teamUpdateSchema, teamUpdateSchemaType } from "@/models/actions/team";
import { assertCanEditTeam } from "@/lib/authorization/team";

export async function updateTeam({
  teamWrapper,
  teamUuid,
}: {
  teamWrapper: teamUpdateSchemaType;
  teamUuid: string;
}) {
  const { team, members } = teamUpdateSchema.parse(teamWrapper);
  const { subject, team: previousTeamData } = await assertCanEditTeam(
    teamUuid,
    team.incubator_id,
  );

  await db.transaction().execute(async (trx) => {
    // update team data
    const incubator = await trx
      .selectFrom("incubators")
      .selectAll()
      .where("uuid", "=", team.incubator_id)
      .executeTakeFirst();
    const udpatedTeam = await trx
      .updateTable("teams")
      .set({
        ...team,
        ghid:
          team.name !== previousTeamData.name
            ? slugify(`${incubator?.ghid}-${team.name}`)
            : previousTeamData.ghid,
      })
      .where("uuid", "=", teamUuid)
      .returningAll()
      .executeTakeFirstOrThrow();

    const previousMembers = await trx
      .deleteFrom("users_teams")
      .where("team_id", "=", teamUuid)
      .returning("uuid")
      .execute();

    let memberIds: { uuid: string }[] = [];
    if (members && members.length) {
      memberIds = await trx
        .insertInto("users_teams")
        .values(
          members.map((memberUuid) => {
            return {
              team_id: teamUuid,
              user_id: memberUuid,
            };
          }),
        )
        .returning("uuid")
        .execute();
    }

    revalidatePath("/teams");

    await addEvent({
      action_code: EventCode.TEAM_UPDATED,
      created_by_username: subject.username,
      action_metadata: {
        value: {
          uuid: udpatedTeam.uuid,
          ghid: udpatedTeam.ghid,
          name: udpatedTeam.name,
          mission: encodeURIComponent(udpatedTeam.mission || ""),
          incubator_id: udpatedTeam.incubator_id,
          memberIds: memberIds.map((m) => m.uuid),
        },
        old_value: {
          uuid: previousTeamData.uuid,
          ghid: previousTeamData.ghid,
          name: previousTeamData.name,
          mission: encodeURIComponent(previousTeamData.mission || ""),
          incubator_id: previousTeamData.incubator_id,
          memberIds: previousMembers.map((m) => m.uuid),
        },
      },
    });
  });
}

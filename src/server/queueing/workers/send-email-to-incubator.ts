import * as Sentry from "@sentry/node";
import _ from "lodash";
import PgBoss from "pg-boss";

import { getLastEventListStartupUuids } from "@/lib/events";
import { getAllIncubators } from "@/lib/kysely/queries/incubators";
import { getStartupsWithoutAnyUpdateForThePastXMonthsRaw } from "@/lib/kysely/queries/startups";
import { getIncubatorTeamMembers } from "@/lib/kysely/queries/teams";
import { getUsersByStartupIds } from "@/lib/kysely/queries/users";
import {
  incubatorToModel,
  memberBaseInfoToModel,
  startupToModel,
} from "@/models/mapper";
import { PHASE_READABLE_NAME } from "@/models/startup";
import { sendEmail } from "@/server/config/email.config";
import { BusinessError } from "@/utils/error";
import { EMAIL_TYPES } from "@modules/email";

export const sendEmailToIncubatorTeamTopic = "send-email-to-incubator-team";

export async function sendEmailToIncubatorTeam(job: PgBoss.Job<void>) {
  console.log("Start send email to incubator team");
  const startups = await getStartupsWithoutAnyUpdateForThePastXMonthsRaw();
  const incubators = await getAllIncubators();
  const startupsByIncubator = _.groupBy(startups, "incubator_id");
  console.log(
    `found ${startups.length} startups and ${
      Object.keys(startupsByIncubator).length
    } incubator`,
  );
  const startupIds = startups.map((startup) => startup.uuid);
  const usersByStartup = await getUsersByStartupIds(startupIds);
  const lastEvents = await getLastEventListStartupUuids(startupIds);
  for (const incubatorId in startupsByIncubator) {
    const incubator = incubators.find(
      (incubator) => incubator.uuid === incubatorId,
    );
    if (!incubator) {
      // send error to sentry and continue
      Sentry.captureException(
        new BusinessError("incubatorShouldExists", "Incubator should exist"),
      );
      continue;
    }
    const membersForTeam = await getIncubatorTeamMembers(incubatorId);
    if (!membersForTeam.length) {
      // send error to sentry and continue
      Sentry.captureException(
        new BusinessError(
          "incubatorTeamListIsEmpty",
          `There is no member in animation teams for incubator ${incubatorId}`,
        ),
      );
      continue;
    }
    const memberEmails = Array.from(
      new Set(
        membersForTeam.map((m) => m.primary_email).filter((email) => !!email),
      ),
    ) as string[];
    console.log(
      `Will send email to ${incubator.title} team : ${memberEmails.join(",")}`,
    );
    const incubatorStartups = startupsByIncubator[incubatorId];
    const now = new Date();
    await sendEmail({
      type: EMAIL_TYPES.EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS,
      variables: {
        incubator: incubatorToModel(incubator),
        startupWrappers: incubatorStartups.map((s) => ({
          startup: startupToModel(s),
          activeMembers: (usersByStartup[s.uuid] || []).filter((member) =>
            memberBaseInfoToModel(member).missions.find((mission) => {
              return (
                now >= mission.start &&
                (!mission.end || now <= mission.end) &&
                mission.startups?.includes(s.uuid)
              );
            }),
          ).length,
          currentPhase: PHASE_READABLE_NAME[s.current_phase],
          // on donne la date du dernier evenement lié à la SE sinon on prend la date de l'update en bdd
          lastModification:
            lastEvents.find((event) => event.action_on_startup === s.uuid)
              ?.created_at || s.updated_at,
        })),
      },
      toEmail: memberEmails,
    });
  }
}

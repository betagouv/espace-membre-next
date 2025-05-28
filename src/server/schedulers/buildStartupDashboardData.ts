import { isAfter, isBefore, startOfMonth, subMonths } from "date-fns";
import { differenceInDays } from "date-fns/differenceInDays";

import { db } from "@/lib/kysely";
import { getAllStartups } from "@/lib/kysely/queries";
import { getAllIncubators } from "@/lib/kysely/queries/incubators";
import { getAllOrganizations } from "@/lib/kysely/queries/organizations";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { Domaine } from "@/models/member";

// Helper function to calculate active missions in a given month
const activeMissionsInMonth = (
  missions: any,
  date: Date,
  domaines?: Domaine[],
): number => {
  return missions.filter((mission) => {
    const missionStarted = isBefore(mission.start, startOfMonth(date));
    const missionEnded = mission.end ? isAfter(mission.end, date) : true;
    return (
      missionStarted &&
      missionEnded &&
      (!domaines || domaines.includes(mission.domaine))
    );
  }).length;
};

const roundToTwoDigits = (value) => {
  return typeof value === "number" ? value.toFixed(2) : value;
};

// Get the number of active missions over the past 3 months
const getActiveMissionStats = (missions: any, domaines?: Domaine[]) => {
  const today = new Date();
  const currentMonth = startOfMonth(today);
  const oneMonthAgo = startOfMonth(subMonths(today, 1));
  const twoMonthsAgo = startOfMonth(subMonths(today, 2));
  const threeMonthsAgo = startOfMonth(subMonths(today, 3));
  const sixMonthsAgo = startOfMonth(subMonths(today, 6));
  const twelveMonthsAgo = startOfMonth(subMonths(today, 12));

  // Count active missions for the current month and previous three months
  const currentActiveMissions = activeMissionsInMonth(
    missions,
    currentMonth,
    domaines,
  );
  const oneMonthAgoMissions = activeMissionsInMonth(
    missions,
    oneMonthAgo,
    domaines,
  );
  const twoMonthsAgoMissions = activeMissionsInMonth(
    missions,
    twoMonthsAgo,
    domaines,
  );
  const threeMonthsAgoMissions = activeMissionsInMonth(
    missions,
    threeMonthsAgo,
    domaines,
  );

  const sixMonthsAgoMissions = activeMissionsInMonth(
    missions,
    sixMonthsAgo,
    domaines,
  );

  const twelveMonthsAgoMissions = activeMissionsInMonth(
    missions,
    twelveMonthsAgo,
    domaines,
  );

  // Determine if the number of missions increased or decreased
  const trend = {
    current: roundToTwoDigits(currentActiveMissions),
    oneMonthAgo: roundToTwoDigits(oneMonthAgoMissions),
    twoMonthsAgo: roundToTwoDigits(twoMonthsAgoMissions),
    threeMonthsAgo: roundToTwoDigits(threeMonthsAgoMissions),
    changeFromLastMonth: roundToTwoDigits(
      currentActiveMissions - oneMonthAgoMissions,
    ),
    trendOverThreeMonths: roundToTwoDigits(
      currentActiveMissions - threeMonthsAgoMissions,
    ),
    trendOverSixMonths: roundToTwoDigits(
      currentActiveMissions - sixMonthsAgoMissions,
    ),
    trendOverTwelveMonths: roundToTwoDigits(
      currentActiveMissions - twelveMonthsAgoMissions,
    ),
  };

  return trend;
};

// 1. Calculate Turnover Rate
const turnoverRate = (
  activeRelativeMissions,
  previousRelativeMissions,
): number => {
  const totalMissions = [...activeRelativeMissions, ...previousRelativeMissions]
    .length;
  const replacedMissions = previousRelativeMissions.filter((endedMission) =>
    activeRelativeMissions.some(
      (activeMission) =>
        activeMission.domaine === endedMission.domaine &&
        activeMission.start! > endedMission.end!,
    ),
  );
  return (replacedMissions.length / totalMissions) * 100;
};

// 2. Calculate Average Mission Duration
const averageMissionDuration = (
  activeRelativeMissions,
  previousRelativeMissions,
): number => {
  const allMissions = [...activeRelativeMissions, ...previousRelativeMissions];
  const today = new Date();
  const totalDays = allMissions.reduce((acc, mission) => {
    const end = mission.end ? mission.end : today;
    return acc + differenceInDays(end, mission.start!);
  }, 0);
  return totalDays / allMissions.length;
};

// 3. Calculate Renewal Rate (missions that were renewed)
const renewalRate = (
  activeRelativeMissions,
  previousRelativeMissions,
): number => {
  const renewedMissions = previousRelativeMissions.filter((endedMission) =>
    activeRelativeMissions.some(
      (activeMission) =>
        activeMission.domaine === endedMission.domaine &&
        activeMission.start! > endedMission.end!,
    ),
  );
  return (renewedMissions.length / previousRelativeMissions.length) * 100;
};

// 4. Calculate Frequency of Replacement (time between mission end and replacement)
const averageReplacementFrequency = (
  activeRelativeMissions,
  previousRelativeMissions,
): number => {
  const replacements = previousRelativeMissions
    .map((endedMission) => {
      const replacement = activeRelativeMissions.find(
        (activeMission) =>
          activeMission.domaine === endedMission.domaine &&
          activeMission.start! > endedMission.end!,
      );
      if (replacement) {
        return differenceInDays(replacement.start!, endedMission.end!);
      }
      return null;
    })
    .filter((days) => days !== null) as number[];

  const totalReplacementDays = replacements.reduce(
    (acc, days) => acc + days,
    0,
  );
  return replacements.length > 0
    ? totalReplacementDays / replacements.length
    : 0;
};

export async function refreshStartupAggregatedData() {
  const startupAggregatedData = await buildStartupDashboardData();
  await db.deleteFrom("startup_aggregated_stats").execute();
  await db
    .insertInto("startup_aggregated_stats")
    .values(
      startupAggregatedData.map((data) => ({
        uuid: data.uuid,
        current_phase: data.current_phase,
        current_phase_start_date: data.current_phase_start_date,
        has_coach: data.hasCoach,
        has_intra: data.hasIntra,
        had_coach: data.hadCoach,
        had_intra: data.hadIntra,
        turnover_rate_value: data.turnoverRateValue,
        average_mission_duration_value: data.averageMissionDurationValue,
        renewal_rate_value: data.renewalRateValue,
        average_replacement_frequency_value:
          data.averageReplacementFrequencyValue,
        // devMissionsTrend values
        dev_current: data.devMissionsTrend.current,
        dev_one_month_ago: data.devMissionsTrend.oneMonthAgo,
        dev_two_months_ago: data.devMissionsTrend.twoMonthsAgo,
        dev_three_months_ago: data.devMissionsTrend.threeMonthsAgo,
        dev_change_from_last_month: data.devMissionsTrend.changeFromLastMonth,
        dev_trend_over_three_months: data.devMissionsTrend.trendOverThreeMonths,
        dev_trend_over_six_months: data.devMissionsTrend.trendOverSixMonths,
        dev_trend_over_twelve_months:
          data.devMissionsTrend.trendOverTwelveMonths,
        // bizdevMissionsTrend values
        bizdev_current: data.bizdevMissionsTrend.current,
        bizdev_one_month_ago: data.bizdevMissionsTrend.oneMonthAgo,
        bizdev_two_months_ago: data.bizdevMissionsTrend.twoMonthsAgo,
        bizdev_three_months_ago: data.bizdevMissionsTrend.threeMonthsAgo,
        bizdev_change_from_last_month:
          data.bizdevMissionsTrend.changeFromLastMonth,
        bizdev_trend_over_three_months:
          data.bizdevMissionsTrend.trendOverThreeMonths,
        bizdev_trend_over_six_months:
          data.bizdevMissionsTrend.trendOverSixMonths,
        bizdev_trend_over_twelve_months:
          data.bizdevMissionsTrend.trendOverTwelveMonths,
        // activeMember (missionsTrend values
        active_member_current: data.activeMember.current,
        active_member_one_month_ago: data.activeMember.oneMonthAgo,
        active_member_two_months_ago: data.activeMember.twoMonthsAgo,
        active_member_three_months_ago: data.activeMember.threeMonthsAgo,
        active_member_change_from_last_month:
          data.activeMember.changeFromLastMonth,
        active_member_trend_over_three_months:
          data.activeMember.trendOverThreeMonths,
        active_member_trend_over_six_months:
          data.activeMember.trendOverSixMonths,
        active_member_trend_over_twelve_months:
          data.activeMember.trendOverTwelveMonths,
      })),
    )
    .execute();
}

export async function buildStartupDashboardData() {
  const today = new Date();

  const startups = await db
    .selectFrom("startups")
    .leftJoin(
      // Subquery to get the current phase based on the condition
      db
        .selectFrom("phases")
        .select(["startup_id", "name", "start as phase_start_date"])
        .where("start", "<", today)
        .where("end", ">", today)
        // Ensure there's only one row per startup
        .as("current_phase"),
      "startups.uuid",
      "current_phase.startup_id",
    )
    .selectAll("startups") // Select all columns from startups
    .select([
      "current_phase.name as current_phase_name",
      "current_phase.phase_start_date as current_phase_start_date",
    ]) // Select computed columns
    .execute();

  const allSponsors = await getAllOrganizations();
  const allIncubators = await getAllIncubators();
  // const members = await getAllUsersInfo();

  // for (const startup of startups) {
  const startupsData = await Promise.all(
    startups.map(async (startup) => {
      console.log(`working on startup : ${startup.ghid}`);

      // Querying startup relative missions
      const startupRelativeMissions = await db
        .selectFrom("missions_startups")
        .where("missions_startups.startup_id", "=", startup.uuid)
        .leftJoin("missions", "mission_id", "missions.uuid")
        .leftJoin("users", "missions.user_id", "users.uuid")
        .selectAll()
        .execute();

      const today = new Date();
      const activeRelativeMissions = startupRelativeMissions.filter(
        (mission) =>
          !mission.end ||
          (mission.start && mission.start < today && mission.end > today),
      );
      const previousRelativeMissions = startupRelativeMissions.filter(
        (mission) => mission.end && mission.end < today,
      );

      const hasCoach = !!activeRelativeMissions.find(
        (mission) => mission.domaine === Domaine.COACHING,
      );

      const hasIntra = !!activeRelativeMissions.find(
        (mission) => mission.domaine === Domaine.INTRAPRENARIAT,
      );

      const hadCoach = !!previousRelativeMissions.find(
        (mission) => mission.domaine === Domaine.COACHING,
      );

      const hadIntra = !!previousRelativeMissions.find(
        (mission) => mission.domaine === Domaine.INTRAPRENARIAT,
      );

      // Execute calculations
      const turnoverRateValue = turnoverRate(
        activeRelativeMissions,
        previousRelativeMissions,
      );
      const averageMissionDurationValue = averageMissionDuration(
        activeRelativeMissions,
        previousRelativeMissions,
      );
      const renewalRateValue = renewalRate(
        activeRelativeMissions,
        previousRelativeMissions,
      );
      const averageReplacementFrequencyValue = averageReplacementFrequency(
        activeRelativeMissions,
        previousRelativeMissions,
      );

      // Get mission trends
      const devMissionsTrend = getActiveMissionStats(startupRelativeMissions, [
        Domaine.DEVELOPPEMENT,
      ]);
      const bizdevMissionsTrend = getActiveMissionStats(
        startupRelativeMissions,
        [Domaine.DEPLOIEMENT],
      );

      const missionsTrend = getActiveMissionStats(startupRelativeMissions);

      // Return the formatted object for each startup
      return {
        uuid: startup.uuid,
        name: startup.name,
        audit: startup.analyse_risques,
        accessibility_status: startup.accessibility_status,
        current_phase: startup.current_phase_name,
        current_phase_start_date: startup.current_phase_start_date,
        incubator: allIncubators.find(
          (incubator) => incubator.uuid === startup.incubator_id,
        ),
        hasCoach,
        hasIntra,
        hadCoach,
        hadIntra,
        turnoverRateValue: roundToTwoDigits(turnoverRateValue),
        averageMissionDurationValue: roundToTwoDigits(
          averageMissionDurationValue,
        ),
        renewalRateValue: roundToTwoDigits(renewalRateValue),
        averageReplacementFrequencyValue: roundToTwoDigits(
          averageReplacementFrequencyValue,
        ),
        devMissionsTrend,
        bizdevMissionsTrend,
        activeMember: missionsTrend,
      };
    }),
  );

  return startupsData;
}

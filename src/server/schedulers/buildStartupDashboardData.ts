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
    domaines?: Domaine[]
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

// Get the number of active missions over the past 3 months
const getActiveMissionStats = (missions: any, domaines?: Domaine[]) => {
    const today = new Date();
    const currentMonth = startOfMonth(today);
    const oneMonthAgo = startOfMonth(subMonths(today, 1));
    const twoMonthsAgo = startOfMonth(subMonths(today, 2));
    const threeMonthsAgo = startOfMonth(subMonths(today, 3));

    // Count active missions for the current month and previous three months
    const currentActiveMissions = activeMissionsInMonth(
        missions,
        currentMonth,
        domaines
    );
    const oneMonthAgoMissions = activeMissionsInMonth(
        missions,
        oneMonthAgo,
        domaines
    );
    const twoMonthsAgoMissions = activeMissionsInMonth(
        missions,
        twoMonthsAgo,
        domaines
    );
    const threeMonthsAgoMissions = activeMissionsInMonth(
        missions,
        threeMonthsAgo,
        domaines
    );

    // Determine if the number of missions increased or decreased
    const trend = {
        current: currentActiveMissions,
        oneMonthAgo: oneMonthAgoMissions,
        twoMonthsAgo: twoMonthsAgoMissions,
        threeMonthsAgo: threeMonthsAgoMissions,
        changeFromLastMonth: currentActiveMissions - oneMonthAgoMissions,
        trendOverThreeMonths: currentActiveMissions - threeMonthsAgoMissions,
    };

    return trend;
};

// 1. Calculate Turnover Rate
const turnoverRate = (
    activeRelativeMissions,
    previousRelativeMissions
): number => {
    const totalMissions = [
        ...activeRelativeMissions,
        ...previousRelativeMissions,
    ].length;
    const replacedMissions = previousRelativeMissions.filter((endedMission) =>
        activeRelativeMissions.some(
            (activeMission) =>
                activeMission.domaine === endedMission.domaine &&
                activeMission.start! > endedMission.end!
        )
    );
    return (replacedMissions.length / totalMissions) * 100;
};

// 2. Calculate Average Mission Duration
const averageMissionDuration = (
    activeRelativeMissions,
    previousRelativeMissions
): number => {
    const allMissions = [
        ...activeRelativeMissions,
        ...previousRelativeMissions,
    ];
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
    previousRelativeMissions
): number => {
    const renewedMissions = previousRelativeMissions.filter((endedMission) =>
        activeRelativeMissions.some(
            (activeMission) =>
                activeMission.domaine === endedMission.domaine &&
                activeMission.start! > endedMission.end!
        )
    );
    return (renewedMissions.length / previousRelativeMissions.length) * 100;
};

// 4. Calculate Frequency of Replacement (time between mission end and replacement)
const averageReplacementFrequency = (
    activeRelativeMissions,
    previousRelativeMissions
): number => {
    const replacements = previousRelativeMissions
        .map((endedMission) => {
            const replacement = activeRelativeMissions.find(
                (activeMission) =>
                    activeMission.domaine === endedMission.domaine &&
                    activeMission.start! > endedMission.end!
            );
            if (replacement) {
                return differenceInDays(replacement.start!, endedMission.end!);
            }
            return null;
        })
        .filter((days) => days !== null) as number[];

    const totalReplacementDays = replacements.reduce(
        (acc, days) => acc + days,
        0
    );
    return replacements.length > 0
        ? totalReplacementDays / replacements.length
        : 0;
};

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
            "current_phase.startup_id"
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
                    (mission.start &&
                        mission.start < today &&
                        mission.end > today)
            );
            const previousRelativeMissions = startupRelativeMissions.filter(
                (mission) => mission.end && mission.end < today
            );

            const hasCoach = activeRelativeMissions.find(
                (mission) => mission.domaine === Domaine.COACHING
            );

            const hasIntra = activeRelativeMissions.find(
                (mission) => mission.domaine === Domaine.INTRAPRENARIAT
            );

            const hadCoach = previousRelativeMissions.find(
                (mission) => mission.domaine === Domaine.COACHING
            );

            const hadIntra = previousRelativeMissions.find(
                // Corrected to previousRelativeMissions
                (mission) => mission.domaine === Domaine.INTRAPRENARIAT
            );

            // Execute calculations
            const turnoverRateValue = turnoverRate(
                activeRelativeMissions,
                previousRelativeMissions
            );
            const averageMissionDurationValue = averageMissionDuration(
                activeRelativeMissions,
                previousRelativeMissions
            );
            const renewalRateValue = renewalRate(
                activeRelativeMissions,
                previousRelativeMissions
            );
            const averageReplacementFrequencyValue =
                averageReplacementFrequency(
                    activeRelativeMissions,
                    previousRelativeMissions
                );

            // Get mission trends
            const devMissionsTrend = getActiveMissionStats(
                startupRelativeMissions,
                [Domaine.DEVELOPPEMENT]
            );
            const bizdevMissionsTrend = getActiveMissionStats(
                startupRelativeMissions,
                [Domaine.DEPLOIEMENT]
            );

            const missionsTrend = getActiveMissionStats(
                startupRelativeMissions
            );

            // Return the formatted object for each startup
            return {
                uuid: startup.uuid,
                name: startup.name,
                audit: startup.analyse_risques,
                accessibility_status: startup.accessibility_status,
                current_phase: startup.current_phase_name,
                current_phase_start_date: startup.current_phase_start_date,
                incubator: allIncubators.find(
                    (incubator) => incubator.uuid === startup.incubator_id
                ),
                hasCoach,
                hasIntra,
                hadCoach,
                hadIntra,
                turnoverRateValue,
                averageMissionDurationValue,
                renewalRateValue,
                averageReplacementFrequencyValue,
                devMissionsTrend,
                bizdevMissionsTrend,
                activeMember: missionsTrend,
            };
        })
    );

    return startupsData;
}

import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

import { memberSchemaType } from "@/models/member";
import { missionSchemaType } from "@/models/mission";

export const getLastMission = (
    missions: missionSchemaType[]
): missionSchemaType | undefined => {
    if (!missions.length) {
        return;
    }
    const lastMission = missions.reduce((a, v) =>
        //@ts-ignore todo
        !v.end || v.end > a.end ? v : a
    );
    return lastMission;
};

export const getLastMissionDate = (
    missions: missionSchemaType[]
): string | null => {
    const latestMission = getLastMission(missions);
    if (latestMission && latestMission.end) {
        return format(latestMission.end, "d MMMM yyyy", { locale: fr });
    }
    return null;
};

export const getFirstMissionDate = (
    missions: missionSchemaType[]
): string | null => {
    const sortedMissions = missions.sort(
        (a, b) => a.start.getTime() - b.start.getTime()
    );
    return (
        (sortedMissions &&
            sortedMissions.length &&
            format(sortedMissions[0].start, "d MMMM yyyy", { locale: fr })) ||
        null
    );
};

/**
 * Return if user is still active at community level
 */
export const isUserActive = (missions: memberSchemaType["missions"]) => {
    return missions.filter((m) => !m.end || m.end > new Date()).length > 0;
};

export const hasActiveMissionInStartup = (
    member: memberSchemaType,
    startupUuid: string
) =>
    member.missions.find(
        (mission) =>
            mission.startups?.includes(startupUuid) &&
            (!mission.end || mission.end >= new Date())
    );

export const hasPreviousMissionInStartup = (
    member: memberSchemaType,
    startupUuid: string
) =>
    member.missions.find(
        (mission) =>
            mission.startups?.includes(startupUuid) &&
            mission.end &&
            mission.end < new Date()
    );

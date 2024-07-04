import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

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

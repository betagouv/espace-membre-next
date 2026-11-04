import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

import { missionSchemaType } from "@/models/mission";
import { memberSchemaType } from "@/models/member";

export const getLastMission = (
  missions: missionSchemaType[],
): missionSchemaType | undefined => {
  if (!missions.length) {
    return;
  }
  // Hors du reduce : `date > null` vaut vrai, une mission ouverte y perdrait
  // face a toute mission datee qui la suit.
  const openMission = missions.find((m) => !m.end);
  if (openMission) return openMission;
  return missions.reduce((a, v) =>
    //@ts-ignore todo
    v.end > a.end ? v : a,
  );
};

export const getLastMissionDate = (
  missions: missionSchemaType[],
): string | null => {
  const latestMission = getLastMission(missions);
  if (latestMission && latestMission.end) {
    return format(latestMission.end, "d MMMM yyyy", { locale: fr });
  }
  return null;
};

export const getFirstMissionDate = (
  missions: missionSchemaType[],
): string | null => {
  const sortedMissions = missions.sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  return (
    (sortedMissions &&
      sortedMissions.length &&
      format(sortedMissions[0].start, "d MMMM yyyy", { locale: fr })) ||
    null
  );
};

export const isUserActive = (missions: memberSchemaType["missions"]) => {
  return missions.filter((m) => !m.end || m.end > new Date()).length > 0;
};

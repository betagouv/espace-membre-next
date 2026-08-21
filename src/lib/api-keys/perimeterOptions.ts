import { AuthSubject } from "@/lib/authorization/subject";
import {
  getLiveMissionStartups,
  getLivePerimeterIncubators,
  getTeamIncubatorStartups,
  PerimeterCandidate,
} from "@/lib/kysely/queries/apiKeyPerimeters";

import { writablePerimeters } from "./writablePerimeters";

export type ApiKeyPerimeterOptions = {
  read: { incubators: PerimeterCandidate[]; startups: PerimeterCandidate[] };
  write: { incubators: PerimeterCandidate[]; startups: PerimeterCandidate[] };
};

/**
 * Le tri final n'est pas cosmetique : les deux sources sont triees chacune de
 * son cote, et la concatenation de deux listes triees ne l'est pas.
 */
const mergeSorted = (options: PerimeterCandidate[]) => {
  const seen = new Set<string>();
  return options
    .filter((option) =>
      seen.has(option.uuid) ? false : (seen.add(option.uuid), true),
    )
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
};

/**
 * Les deux listes du formulaire de creation, calculees en un seul endroit.
 *
 * LECTURE : les rattachements vivants seulement. Un incubateur atteint par une
 * mission terminee n'y figure plus. Il reste lisible, la lecture globale etant
 * ouverte a tout membre, mais la liste cesse de pretendre qu'il decrit encore
 * un rattachement.
 *
 * ECRITURE : les candidats de lecture, ELARGIS aux produits des incubateurs
 * d'equipe, puis filtres par canUseWritePerimeter. L'elargissement n'est pas un
 * assouplissement, c'est une completion : canEditStartup ouvre deja ces produits
 * par la seule appartenance a l'equipe, ils manquaient simplement a la liste.
 * Le filtre garantit qu'aucune option proposee ne sera refusee au submit.
 */
export async function apiKeyPerimeterOptions(
  subject: AuthSubject,
  userUuid: string,
): Promise<ApiKeyPerimeterOptions> {
  const [missionStartups, incubators, teamStartups] = await Promise.all([
    getLiveMissionStartups(userUuid),
    getLivePerimeterIncubators(userUuid),
    getTeamIncubatorStartups(userUuid),
  ]);

  const read = { incubators, startups: missionStartups };
  const write = await writablePerimeters(subject, {
    incubators,
    startups: mergeSorted([...missionStartups, ...teamStartups]),
  });

  return { read, write };
}

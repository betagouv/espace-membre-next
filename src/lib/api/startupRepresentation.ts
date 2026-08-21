import { Selectable } from "kysely";

import { Startups } from "@/@types/db";
import { currentPhaseName } from "@/lib/startupPhase";
import { incubatorRefSchemaType } from "@/models/api/incubator";
import { startupPhaseApiResponseSchemaType } from "@/models/api/startup";

/**
 * Projection UNIQUE des colonnes de `startups` vers le contrat de l'API.
 *
 * Elle ne passe pas par `startupToModel` : ce mappeur sert le modele du site
 * web, dont le schema exige des chaines, et coerce donc pitch, contact,
 * description et dsfr_status en `""`. Les schemas de sortie de l'API declarent
 * ces champs `.nullable()`, et les autres routes produit rendent la valeur
 * reelle : la coercition faisait lire le meme produit differemment selon la
 * route, et faisait persister `""` a la place de NULL au retour d'un cycle
 * lire-modifier-ecrire.
 *
 * Seules les listes jsonb sont normalisees, parce que la colonne peut porter
 * autre chose qu'un tableau et que le schema, lui, n'accepte qu'un tableau.
 */
const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? (value as string[]) : [];

type StartupRow = Selectable<Startups> & {
  incubators: incubatorRefSchemaType[];
  phases: startupPhaseApiResponseSchemaType[];
};

export function toApiStartup(row: StartupRow) {
  return {
    uuid: row.uuid,
    ghid: row.ghid,
    name: row.name,
    pitch: row.pitch,
    incubator_id: row.incubator_id,
    incubators: row.incubators,
    contact: row.contact,
    description: row.description,
    link: row.link,
    repository: row.repository,
    accessibility_status: row.accessibility_status,
    dsfr_status: row.dsfr_status,
    techno: asStringArray(row.techno),
    thematiques: asStringArray(row.thematiques),
    usertypes: asStringArray(row.usertypes),
    phases: row.phases,
    current_phase: currentPhaseName(row.phases),
  };
}

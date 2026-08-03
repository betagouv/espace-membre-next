/**
 * Items de checklist qui ne sont pas auto-déclaratifs : seule l'équipe
 * d'animation (ou un admin) peut les cocher/décocher, pour attester d'une
 * participation.
 *
 * Volontairement défini en TypeScript et non dans les fichiers yml : le yml est
 * lu par getChecklistObject() qui renvoie `null` quand le parse échoue, ce qui
 * ferait sauter la protection en silence.
 *
 * Ce module est importé côté client (Checklist.tsx) autant que côté serveur : il
 * ne doit contenir aucun import de configuration serveur.
 */
export const RESTRICTED_CHECKLIST_ITEM_IDS = [
  "onboarding-atelier-onboarding",
] as const;

export const isRestrictedChecklistItem = (fieldId: string): boolean =>
  (RESTRICTED_CHECKLIST_ITEM_IDS as readonly string[]).includes(fieldId);

// Bornes des tableaux recus du client. Zod 4 ne coupe la validation d'un
// tableau qu'a partir d'un .max() : sans borne, N elements invalides produisent
// N issues (GHSA-mrhx-c7xc-m3w5). Chaque borne est tres au-dessus des usages
// reels pour ne bloquer aucune saisie legitime.

export const MAX_TAGS = 100;
export const MAX_RELATED_IDS = 200;
export const MAX_TEAM_MEMBERS = 1000;
export const MAX_TIMELINE_ITEMS = 200;
export const MAX_MEMBER_MISSIONS = 100;
export const MAX_MEETING_PARTICIPANTS = 200;
export const MAX_MEETING_DATES = 100;

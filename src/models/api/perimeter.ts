import { z } from "zod";

// Stocke en base sous forme de couple (kind, id) sans clef etrangere, avec
// CHECK ; expose en ghid dans meta.perimeter et dans l'UI.
export type ApiPerimeter =
  | { kind: "global" }
  | { kind: "incubator"; uuid: string }
  | { kind: "startup"; uuid: string };

/**
 * Classe UNICODE et non ASCII. Ce motif valide `${kind}/${ghid}` ou le ghid
 * sort de la BASE, pas du client : il ne protege donc de rien, alors qu'un jeu
 * ASCII rejetait des ghid accentues bien reels. L'effet etait severe et muet :
 * la clef se creait, l'ecran l'affichait « Active », chaque requete rendait 401
 * en accusant un perimetre disparu qui existait toujours, et le balayage ne la
 * revoquait jamais puisqu'il ne teste que l'existence de l'uuid.
 *
 * Ce qui reste utile a contraindre est la FORME : un seul separateur, ni espace
 * ni caractere de controle, pour que le libelle publie dans meta.perimeter
 * reste analysable.
 */
export const perimeterLabelSchema = z
  .string()
  .regex(/^(global|(incubator|startup)\/[\p{L}\p{N}._-]+)$/u);
export type PerimeterLabel = z.infer<typeof perimeterLabelSchema>;

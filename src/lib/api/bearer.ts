// Seule definition de la grammaire du jeton. Importe par src/middleware.ts
// (Edge) et par withApiV1 (Node) : ces deux etages doivent accepter exactement
// le meme ensemble d'en-tetes. Ne jamais y ajouter d'import node:*.
export const API_KEY_PREFIX = "em1_";

// Bearer strict : pas de tolerance de casse sur le schema, pas de jeton hors
// prefixe em1_. Tout le reste est un 401 sans acces base.
const BEARER_RE = /^Bearer +(em1_[A-Za-z0-9_-]{20,})$/;

export function extractBearerToken(header: string | null): string | null {
  if (!header) return null;
  return BEARER_RE.exec(header.trim())?.[1] ?? null;
}

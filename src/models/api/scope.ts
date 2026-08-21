import { z } from "zod";

// Grammaire ressource:action, enum ferme. Pas de wildcard, pas de scope admin,
// pas de scope de gestion de clefs : une clef ne cree jamais une clef. Les
// standards produit sont couverts par startups:write, sans scope dedie.
export const API_SCOPES = [
  "members:read",
  "startups:read",
  "incubators:read",
  "startups:write",
  "incubators:write",
] as const;

export const apiScopeSchema = z.enum(API_SCOPES);
export type ApiScope = z.infer<typeof apiScopeSchema>;

export const apiScopesSchema = z.array(apiScopeSchema).min(1);

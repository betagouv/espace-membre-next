import { z } from "zod";

import { perimeterLabelSchema } from "./perimeter";
import { apiScopeSchema, apiScopesSchema } from "./scope";

// kysely-codegen ne rend que `string` et `string[]` pour kind, scopes et les
// perimetres : la base ne garantit que ses CHECK, et un CHECK peut avoir ete
// pose avant qu'un scope ne soit retire de l'enumeration. Rien dans le code ne
// reconstruit ces valeurs a la main, tout passe par ce module.
export const apiKeyKindSchema = z.enum(["personal", "service"]);
export type ApiKeyKind = z.infer<typeof apiKeyKindSchema>;

// Lu par toApiKeyContext. Un scope inconnu fait echouer ce parse, donc rejette
// la clef en 401 invalid_token, avant tout touchApiKey.
export const apiKeyContextRowSchema = z.object({
  kind: apiKeyKindSchema,
  scopes: apiScopesSchema,
});

// Saisie de l'UI : les perimetres arrivent en uuid, le formulaire choisit dans
// une liste et le ghid n'est qu'un affichage.
const perimeterInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("global") }),
  z.object({ kind: z.literal("incubator"), uuid: z.string().uuid() }),
  z.object({ kind: z.literal("startup"), uuid: z.string().uuid() }),
]);

export const apiKeyCreateSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    kind: apiKeyKindSchema,
    scopes: apiScopesSchema,
    read_perimeter: perimeterInputSchema,
    write_perimeter: perimeterInputSchema.nullable().default(null),
    expires_at: z.coerce
      .date()
      .nullable()
      .default(null)
      .refine((d) => d === null || d.getTime() > Date.now(), {
        message: "L'expiration doit etre dans le futur.",
      }),
    // Clef d'application : incubateur porteur, ou null pour une clef
    // d'organisation, reservee aux admins.
    owner_incubator_id: z.string().uuid().nullable().default(null),
  })
  .refine((v) => v.kind === "service" || v.owner_incubator_id === null, {
    path: ["owner_incubator_id"],
    message: "Une clef personnelle n'a pas d'incubateur porteur.",
  })
  // Miroir applicatif de chk_api_keys_write_needs_perimeter : le formulaire doit
  // rendre l'erreur sur le champ, pas laisser Postgres la renvoyer en 409.
  .refine(
    (v) =>
      !v.scopes.some((s) => s.endsWith(":write")) || v.write_perimeter !== null,
    {
      path: ["write_perimeter"],
      message: "Une portee d'ecriture exige un perimetre d'ecriture.",
    },
  )
  // canWriteIncubator refuse par construction un perimetre de nature produit
  // (section 5.4) : sans ce refine on livrerait une clef portant
  // incubators:write incapable d'ecrire quoi que ce soit, sans que rien ne le
  // signale. Le cas symetrique n'existe pas : un perimetre incubateur ouvre
  // bien l'ecriture de ses produits.
  .refine(
    (v) =>
      !v.scopes.includes("incubators:write") ||
      v.write_perimeter?.kind !== "startup",
    {
      path: ["write_perimeter"],
      message:
        "La portee incubators:write exige un perimetre d'ecriture global ou incubateur, pas un produit.",
    },
  );
export type ApiKeyCreate = z.infer<typeof apiKeyCreateSchema>;

// Sortie de listing. token_hash n'y figure pas : ce schema est la garantie de
// type de la regle posee sur les requetes de listing.
export const apiKeyListItemSchema = z.object({
  uuid: z.string().uuid(),
  kind: apiKeyKindSchema,
  name: z.string(),
  token_prefix: z.string(),
  scopes: z.array(apiScopeSchema),
  // null = cible du perimetre supprimee. La clef est deja refusee a
  // l'authentification et sera revoquee au prochain balayage ; l'UI l'affiche
  // comme telle plutot que de masquer le probleme.
  read_perimeter: perimeterLabelSchema.nullable(),
  write_perimeter: perimeterLabelSchema.nullable(),
  owner_user_id: z.string().uuid().nullable(),
  owner_incubator_id: z.string().uuid().nullable(),
  expires_at: z.date().nullable(),
  last_used_at: z.date().nullable(),
  revoked_at: z.date().nullable(),
  revoked_reason: z.string().nullable(),
  created_at: z.date(),
});
export type ApiKeyListItem = z.infer<typeof apiKeyListItemSchema>;

// Le jeton clair n'apparait qu'ici, une seule fois, dans la reponse de creation.
// Il n'est ni stocke, ni relisible, ni journalise.
export const apiKeyCreatedSchema = apiKeyListItemSchema.extend({
  token: z.string(),
});
export type ApiKeyCreated = z.infer<typeof apiKeyCreatedSchema>;

// chk_api_keys_revocation impose un motif des qu'il y a une revocation : le
// champ est obligatoire cote formulaire aussi.
export const apiKeyRevokeSchema = z.object({
  uuid: z.string().uuid(),
  revoked_reason: z.string().trim().min(3).max(500),
});
export type ApiKeyRevoke = z.infer<typeof apiKeyRevokeSchema>;

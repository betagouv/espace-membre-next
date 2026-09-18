import { z } from "zod";

// Schema de reponse pour /api/v1/incubators.
// Volontairement permissif (pas de contraintes de longueur metier) : il decrit
// le contrat de sortie et ne doit jamais rejeter des donnees valides en base.
export const incubatorApiResponseSchema = z.object({
  uuid: z.string(),
  title: z.string(),
  ghid: z.string(),
  short_description: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
  // uuids en base, exposes en ghid comme partout ailleurs dans l'API. Colonne
  // nulle rendue en tableau vide, reference orpheline filtree : le tableau ne
  // porte que des ghid resolvables.
  highlighted_startups: z.array(z.string()),
});
export type incubatorApiResponseSchemaType = z.infer<
  typeof incubatorApiResponseSchema
>;

// Incubateur EMBARQUE dans une autre ressource : uuid, ghid et titre suffisent.
export const incubatorRefSchema = z.object({
  uuid: z.string(),
  ghid: z.string(),
  title: z.string(),
});
export type incubatorRefSchemaType = z.infer<typeof incubatorRefSchema>;

// Corps accepte par PATCH /api/v1/incubators/{id} (merge-patch RFC 7396). Le
// ghid n'est pas exposable en ecriture : un renommage change l'identifiant de
// route, oriente le logo vers un nouveau chemin S3 et cree un nouveau fichier
// sur beta.gouv.fr.
export const incubatorPatchSchema = z
  .object({
    // incubators.title, contact et address sont varchar(255).
    title: z.string().min(1).max(255),
    short_description: z.string().nullable(),
    description: z.string().nullable(),
    contact: z.string().max(255).nullable(),
    address: z.string().max(255).nullable(),
    website: z.string().nullable(),
    github: z.string().nullable(),
    // En ghid : la conversion vers uuid se fait a l'ecriture, un ghid inconnu
    // produit un 422 avec le pointeur /highlighted_startups/<index>.
    highlighted_startups: z.array(z.string()),
  })
  .partial();
export type incubatorPatchSchemaType = z.infer<typeof incubatorPatchSchema>;

import { z } from "zod";

import { MAX_STARTUP_URLS } from "@/models/arrayLimits";

export const STARTUP_URL_TYPES = [
  "website",
  "repository",
  "stats",
  "budget",
  "roadmap",
  "dashlord",
  "ecodesign",
  "tech_audit",
  "impact",
  "analyse_risques",
  "tool",
  "demo",
  "support",
  "other",
] as const;

export type StartupUrlType = (typeof STARTUP_URL_TYPES)[number];

export type StartupUrl = {
  type: StartupUrlType;
  label: string | null;
  url: string;
};

export const STARTUP_URL_TYPE_LABELS: Record<StartupUrlType, string> = {
  website: "Site web",
  repository: "Dépôt de code",
  stats: "Statistiques d'usage",
  budget: "Budget",
  roadmap: "Roadmap / tickets",
  dashlord: "Rapport DashLord",
  ecodesign: "Déclaration d'écoconception",
  tech_audit: "Audit technique",
  impact: "Matrice d'impact",
  analyse_risques: "Analyse de risques",
  tool: "Outil",
  demo: "Démo",
  support: "Support",
  other: "Autre",
};

// Un seul lien par produit pour ces types, garanti en base par un index unique
// partiel. Les autres types acceptent plusieurs liens (plusieurs dépôts, etc.).
export const SINGLE_STARTUP_URL_TYPES: readonly StartupUrlType[] = [
  "stats",
  "budget",
  "roadmap",
  "dashlord",
  "ecodesign",
  "tech_audit",
  "impact",
  "analyse_risques",
];

// Colonnes historiques de startups, maintenues en miroir de la table
// startup_urls jusqu'à leur suppression : chacune reçoit le premier lien de
// son type.
export const LEGACY_STARTUP_URL_COLUMNS = {
  website: "link",
  repository: "repository",
  stats: "stats_url",
  budget: "budget_url",
  roadmap: "roadmap_url",
  dashlord: "dashlord_url",
  ecodesign: "ecodesign_url",
  tech_audit: "tech_audit_url",
  impact: "impact_url",
  analyse_risques: "analyse_risques_url",
} as const satisfies Partial<Record<StartupUrlType, string>>;

export type LegacyStartupUrlType = keyof typeof LEGACY_STARTUP_URL_COLUMNS;

// Ces colonnes miroir sont en varchar(255) : un lien plus long ferait échouer
// la recopie, donc l'écriture entière.
export const VARCHAR_255_STARTUP_URL_TYPES: readonly StartupUrlType[] = [
  "ecodesign",
  "tech_audit",
  "impact",
  "roadmap",
];

/** Seuls les liens http(s) sont rendus cliquables. */
export const isHttpUrl = (url: string) => /^https?:\/\//i.test(url);

// Liste blanche et non liste noire : un navigateur ignore les caractères de
// contrôle et les blancs d'une URL, si bien que « java\tscript: » s'exécute.
// Une chaîne sans schéma (ex : git@git.example:produit.git) reste du texte
// libre accepté.
export const isUnsafeUrl = (url: string) => {
  const compact = url.replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
  return (
    /^[a-z][a-z0-9+.-]*:/i.test(compact) && !/^(https?|mailto):/i.test(compact)
  );
};

export const UNSAFE_URL_MESSAGE = "Ce type de lien n'est pas autorisé";

export const startupUrlSchema = z.object({
  type: z.enum(STARTUP_URL_TYPES),
  label: z.string().trim().nullable().optional(),
  // Pas de .url() general : la base contient des chaînes libres reprises des
  // anciennes colonnes, qu'un contrôle de format empêcherait de réenregistrer.
  // Seul le site web garde l'exigence http(s) qu'avait l'ancien champ link.
  url: z
    .string()
    .trim()
    .min(1, "L'URL est obligatoire")
    .refine((url) => !isUnsafeUrl(url), UNSAFE_URL_MESSAGE),
});
export type startupUrlSchemaType = z.infer<typeof startupUrlSchema>;

export const startupUrlsSchema = z
  .array(startupUrlSchema)
  .max(MAX_STARTUP_URLS)
  .superRefine((urls, ctx) => {
    const seen = new Set<StartupUrlType>();
    urls.forEach((startupUrl, index) => {
      if (SINGLE_STARTUP_URL_TYPES.includes(startupUrl.type)) {
        if (seen.has(startupUrl.type)) {
          ctx.addIssue({
            code: "custom",
            path: [index, "type"],
            message: `Un seul lien de type « ${STARTUP_URL_TYPE_LABELS[startupUrl.type]} » est possible`,
          });
        }
        seen.add(startupUrl.type);
      }
      if (startupUrl.type === "website" && !isHttpUrl(startupUrl.url)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "url"],
          message:
            "L'URL fournie doit respecter le format suivant : https://exemple.com",
        });
      }
      if (
        VARCHAR_255_STARTUP_URL_TYPES.includes(startupUrl.type) &&
        startupUrl.url.length > 255
      ) {
        ctx.addIssue({
          code: "custom",
          path: [index, "url"],
          message: "Ce lien ne doit pas dépasser 255 caractères",
        });
      }
    });
  });

/** Premier lien d'un type, dans l'ordre d'affichage. */
export function primaryStartupUrl(
  urls: readonly { type: string; url: string }[],
  type: StartupUrlType,
): string | null {
  return urls.find((startupUrl) => startupUrl.type === type)?.url ?? null;
}

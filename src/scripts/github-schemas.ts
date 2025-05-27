import { z } from "zod";

export const incubator = z.object({
  title: z.string(),
  short_description: z.string(),
  owner: z.string(),
  logo: z.string(),
  contact: z.string(),
  address: z.string(),
  website: z.string(),
  github: z.string(),
  highlighted_startups: z.array(z.string()).optional(),
});

export const organisation = z.object({
  name: z.string(),
  acronym: z.string(),
  domaine_ministeriel: z.string(),
  type: z.string(),
});

export const team = z.object({
  name: z.string(),
  mission: z.string(),
  incubator: z.string(),
});

export const startup = z.object({
  title: z.string(),
  mission: z.string(),
  sponsors: z.array(z.string()).optional(),
  incubator: z.string(),
  contact: z.string(),
  link: z.string().optional().nullable(),
  repository: z.string().optional().nullable(),
  accessibility_status: z.string().optional(),
  dashlord_url: z.string().optional().nullable(),
  stats: z.boolean().optional().nullable(),
  stats_url: z.string().optional().nullable(),
  budget_url: z.string().optional().nullable(),
  analyse_risques: z.boolean().optional().nullable(),
  analyse_risques_url: z.string().optional().nullable(),
  events: z
    .array(
      z.object({
        name: z.string(),
        comment: z.string().optional(),
        date: z.date(),
      }),
    )
    .optional(),
  phases: z
    .array(
      z.object({
        name: z.string(),
        start: z.date(),
        end: z.date().optional().nullable(),
        comment: z.string().optional(),
      }),
    )
    .optional(),
  techno: z.array(z.string()).optional(),
  usertypes: z.array(z.string()).optional(),
  thematiques: z.array(z.string()).optional(),
  redirect_from: z.array(z.string()).optional(),
  fast: z.object({ promotion: z.number(), montant: z.number() }).optional(),
  mon_service_securise: z.boolean().optional().nullable(),
});

// todo: share with espace-membre
const domaines = [
  "Animation",
  "Coaching",
  "Déploiement",
  "Design",
  "Développement",
  "Intraprenariat",
  "Produit",
  "Data",
  "Support",
  "Autre",
] as const;

const preventDuplicates = (val, ctx) => {
  if (val && val.length !== new Set(val).size) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `No duplicates allowed.`,
    });
  }
};

// const startupsPath = "./content/_startups";
// const startupsIds = (await fs.readdir(startupsPath)).filter((path) => path.endsWith(".md")).map((p) => p.replace(/\.md$/, ""));

export const author = z.object({
  fullname: z.string().min(1),
  role: z.string().min(1),
  link: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  github: z.string().optional().nullable(),
  missions: z
    .array(
      z.object({
        start: z.date(),
        end: z.date(),
        status: z.string(),
        employer: z.string().optional().nullable(),
        startups: z.array(z.string()).optional().superRefine(preventDuplicates),
      }),
    )
    .optional(),
  previously: z
    .array(z.string())
    .optional()
    .nullable()
    .superRefine(preventDuplicates),
  startups: z
    .array(z.string())
    .optional()
    .nullable()
    .superRefine(preventDuplicates),
  badges: z.array(z.string()).optional().nullable(),
  domaine: z.enum(domaines),
  competences: z
    .array(z.string())
    .optional()
    .nullable()
    .superRefine(preventDuplicates),
  teams: z.array(z.string()).optional().nullable(),
});

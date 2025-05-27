// export interface BadgeDossier {
//     id: string,
//     number: number,
//     archived: boolean,
//     state: string,
//     dateDerniereModification: string,
//     dateDepot: string,
//     datePassageEnConstruction: string | null,
//     datePassageEnInstruction: string | null,
//     dateTraitement: string | null,
//     dateExpiration: string | null,
//     dateSuppressionParUsager: null,
//     motivation: string,
//     traitements: {
//         state: 'en_construction' | 'en_instruction' | 'accepte',
//         emailAgentTraitant: string | null,
//         dateTraitement: string,
//         motivation: string | null

//     }[],
//     champs: {
//         id: string,
//         label: string,
//         stringValue: string
//     }[],
//     annotations: [
//         {
//             label: 'reçu chez anne',
//             stringValue: 'false',
//             checked: boolean
//         },
//         {
//             label: 'valider dans origami',
//             stringValue: 'false',
//             checked: boolean
//         },
//         {
//             label: 'à valider par florian',
//             stringValue: 'false',
//             checked: boolean
//         },
//         {
//             label: 'badge à récupérer',
//             stringValue: 'false',
//             checked: boolean
//         },
//         {
//             "label":"Status",
//             "stringValue": string
//         }
//     ]
// }

import { z } from "zod";

const traitementsSchema = z.object({
  state: z.enum(["en_construction", "en_instruction", "accepte"]),
  emailAgentTraitant: z.string().nullable(),
  dateTraitement: z.string(),
  motivation: z.string().nullable(),
});

const champsSchema = z.object({
  id: z.string(),
  label: z.string(),
  stringValue: z.string(),
});

const annotationsSchema = z.union([
  z.object({
    label: z.literal("reçu chez anne"),
    stringValue: z.literal("false"),
    checked: z.boolean(),
  }),
  z.object({
    label: z.literal("valider dans origami"),
    stringValue: z.literal("false"),
    checked: z.boolean(),
  }),
  z.object({
    label: z.literal("à valider par florian"),
    stringValue: z.literal("false"),
    checked: z.boolean(),
  }),
  z.object({
    label: z.literal("badge à récupérer"),
    stringValue: z.literal("false"),
    checked: z.boolean(),
  }),
  z.object({
    label: z.literal("Status"),
    stringValue: z.string(),
  }),
]);

const badgeDossierSchema = z.object({
  id: z.string(),
  number: z.number(),
  archived: z.boolean(),
  state: z.string(),
  dateDerniereModification: z.string(),
  dateDepot: z.string(),
  datePassageEnConstruction: z.string().nullable(),
  datePassageEnInstruction: z.string().nullable(),
  dateTraitement: z.string().nullable(),
  dateExpiration: z.string().nullable(),
  dateSuppressionParUsager: z.null(),
  motivation: z.string(),
  traitements: z.array(traitementsSchema),
  champs: z.array(champsSchema),
  annotations: z.array(annotationsSchema),
});

export type badgeDossierSchemaType = z.infer<typeof badgeDossierSchema>;

export { badgeDossierSchema };

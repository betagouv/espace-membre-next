import { z } from "zod";

import { MAX_RELATED_IDS, MAX_TIMELINE_ITEMS } from "@/models/arrayLimits";

import { sponsorSchema } from "../sponsor";
import { eventSchema, phaseSchema, startupSchema } from "@/models/startup";
import { startupUrlsSchema } from "@/models/startupUrl";

export const startupInfoUpdateSchema = z.object({
  startup: z.object({
    name: startupSchema.shape.name,
    pitch: startupSchema.shape.pitch,
    incubator_ids: z
      .array(z.string().uuid())
      .min(1, "Au moins un incubateur est obligatoire")
      .max(MAX_RELATED_IDS)
      .describe("Incubateurs"),
    contact_dinum: startupSchema.shape.contact_dinum,
    contact_incubator: startupSchema.shape.contact_incubator,
    contact: startupSchema.shape.contact,
    accessibility_status: startupSchema.shape.accessibility_status,
    mon_service_securise: startupSchema.shape.mon_service_securise,
    analyse_risques: startupSchema.shape.analyse_risques,
    //  events: startupSchema.shape.events,
    techno: startupSchema.shape.techno,
    usertypes: startupSchema.shape.usertypes,
    //redirect_from: z.array(z.string()).optional(),
    fast: startupSchema.shape.fast,
    thematiques: startupSchema.shape.thematiques,
    description: startupSchema.shape.description,
    has_mobile_app: startupSchema.shape.has_mobile_app,
    is_private_url: startupSchema.shape.is_private_url,
    dsfr_status: startupSchema.shape.dsfr_status,
  }),
  startupUrls: startupUrlsSchema,
  shot: z
    .any()
    .refine((file) => file?.size > 0, "File is required")
    .nullable()
    .optional(),
  hero: z
    .any()
    .refine((file) => file?.size > 0, "File is required")
    .nullable()
    .optional(),
  shouldDeleteShot: z.boolean().optional(),
  shouldDeleteHero: z.boolean().optional(),
  startupSponsors: z.array(z.string()).max(MAX_RELATED_IDS),
  newSponsors: z
    .array(
      sponsorSchema.omit({
        uuid: true,
      }),
    )
    .max(MAX_RELATED_IDS),
  startupPhases: z
    .array(
      phaseSchema.omit({
        uuid: true,
        startup_id: true,
      }),
    )
    .max(MAX_TIMELINE_ITEMS),
  startupEvents: z
    .array(
      eventSchema.omit({
        uuid: true,
        startup_id: true,
      }),
    )
    .max(MAX_TIMELINE_ITEMS),
  newPhases: z
    .array(
      phaseSchema.omit({
        uuid: true,
        startup_id: true,
      }),
    )
    .max(MAX_TIMELINE_ITEMS),
});

export type startupInfoUpdateSchemaType = z.infer<
  typeof startupInfoUpdateSchema
>;
export type startupInfoUpdateSchemaInputType = z.input<
  typeof startupInfoUpdateSchema
>;

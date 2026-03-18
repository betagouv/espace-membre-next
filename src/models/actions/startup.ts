import { z } from "zod";

import { sponsorSchema } from "../sponsor";
import { FileType } from "@/lib/file";
import {
  eventSchema,
  phaseSchema,
  startupSchema,
  startupUrlSchema,
} from "@/models/startup";

export const startupInfoUpdateSchema = z.object({
  startup: z.object({
    name: startupSchema.shape.name,
    pitch: startupSchema.shape.pitch,
    incubator_id: startupSchema.shape.incubator_id,
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
  startup_urls: z.array(startupUrlSchema),
  shot: z
    .instanceof(FileType)
    .refine((file) => file.size > 0, "File is required")
    .nullable()
    .optional(),
  hero: z
    .instanceof(FileType)
    .refine((file) => file.size > 0, "File is required")
    .nullable()
    .optional(),
  shouldDeleteShot: z.boolean().optional(),
  shouldDeleteHero: z.boolean().optional(),
  startupSponsors: z.array(z.string()),
  newSponsors: z.array(
    sponsorSchema.omit({
      uuid: true,
    }),
  ),
  startupPhases: z.array(
    phaseSchema.omit({
      uuid: true,
      startup_id: true,
    }),
  ),
  startupEvents: z.array(
    eventSchema.omit({
      uuid: true,
      startup_id: true,
    }),
  ),
  newPhases: z.array(
    phaseSchema.omit({
      uuid: true,
      startup_id: true,
    }),
  ),
});

export type startupInfoUpdateSchemaType = z.infer<
  typeof startupInfoUpdateSchema
>;

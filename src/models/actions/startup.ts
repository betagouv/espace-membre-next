import { z } from "zod";

import { sponsorSchema } from "../sponsor";
import { FileType } from "@/lib/file";
import { eventSchema, phaseSchema, startupSchema } from "@/models/startup";

export const startupInfoUpdateSchema = z.object({
  startup: z.object({
    name: startupSchema.shape.name,
    pitch: startupSchema.shape.pitch,
    incubator_id: startupSchema.shape.incubator_id,
    contact: startupSchema.shape.contact,
    link: startupSchema.shape.link,
    repository: startupSchema.shape.repository,
    accessibility_status: startupSchema.shape.accessibility_status,
    dashlord_url: startupSchema.shape.dashlord_url,
    stats_url: startupSchema.shape.stats_url,
    budget_url: startupSchema.shape.budget_url,
    mon_service_securise: startupSchema.shape.mon_service_securise,
    analyse_risques: startupSchema.shape.analyse_risques,
    analyse_risques_url: startupSchema.shape.analyse_risques_url,
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
    tech_audit_url: startupSchema.shape.tech_audit_url,
    roadmap_url: startupSchema.shape.roadmap_url,
    ecodesign_url: startupSchema.shape.ecodesign_url,
    impact_url: startupSchema.shape.impact_url,
  }),
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

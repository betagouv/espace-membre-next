import { z } from "zod";

import { sponsorSchema } from "../sponsor";
import { phaseSchema, startupSchema } from "@/models/startup";

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
        events: startupSchema.shape.events,
        techno: startupSchema.shape.techno,
        usertypes: startupSchema.shape.usertypes,
        //redirect_from: z.array(z.string()).optional(),
        fast: startupSchema.shape.fast,
        thematiques: startupSchema.shape.thematiques,
        description: startupSchema.shape.description,
    }),
    startupSponsors: z.array(z.string()),
    newSponsors: z.array(
        sponsorSchema.omit({
            uuid: true,
        })
    ),
    startupPhases: z.array(
        phaseSchema.omit({
            uuid: true,
        })
    ),
    newPhases: z.array(
        phaseSchema.omit({
            uuid: true,
        })
    ),
});

export type startupInfoUpdateSchemaType = z.infer<
    typeof startupInfoUpdateSchema
>;
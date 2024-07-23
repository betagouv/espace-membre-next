import { z } from "zod";

import { sponsorSchema } from "@/models/sponsor";

export const organizationUpdateSchema = z.object({
    name: sponsorSchema.shape.name,
    acronym: sponsorSchema.shape.acronym,
    domaine_ministeriel: sponsorSchema.shape.domaine_ministeriel,
    type: sponsorSchema.shape.type,
});

export type organizationUpdateSchemaType = z.infer<
    typeof organizationUpdateSchema
>;

import { z } from "zod";

import { teamSchema } from "@/models/team";

export const teamUpdateSchema = z.object({
  team: z.object({
    name: teamSchema.shape.name,
    mission: teamSchema.shape.mission,
    incubator_id: teamSchema.shape.incubator_id,
  }),
  members: z.array(z.string()),
});

export type teamUpdateSchemaType = z.infer<typeof teamUpdateSchema>;

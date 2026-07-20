import z from "zod";

import { MaintenanceWrapperDataSchema } from "./maintenance";

export const CreateDimailMailboxDataSchema =
  MaintenanceWrapperDataSchema.extend({
    userUuid: z.string().uuid(),
    username: z.string(),
    requestId: z.string().uuid(),
  }).strict();
export type CreateDimailAdressDataSchemaType = z.infer<
  typeof CreateDimailMailboxDataSchema
>;

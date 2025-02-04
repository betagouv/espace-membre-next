import { z } from "zod";

import { MaintenanceWrapperDataSchema } from "./maintenance";
import { memberSchema } from "../member";

export const SendNewMemberValidationEmailSchema =
    MaintenanceWrapperDataSchema.extend({
        userId: memberSchema.shape.uuid,
    }).strict();

export type SendNewMemberValidationEmailSchemaType = z.infer<
    typeof SendNewMemberValidationEmailSchema
>;

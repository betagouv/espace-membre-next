import { z } from "zod";

import { MaintenanceWrapperDataSchema } from "./maintenance";
import { createMemberSchema } from "../actions/member";
import { memberSchema } from "../member";

export const SendNewMemberValidationEmailSchema =
    MaintenanceWrapperDataSchema.extend({
        userId: memberSchema.shape.uuid,
        incubator_id: createMemberSchema._def.schema.shape.incubator_id,
    }).strict();

export type SendNewMemberValidationEmailSchemaType = z.infer<
    typeof SendNewMemberValidationEmailSchema
>;

export const SendEmailToTeamWhenNewMemberSchema =
    MaintenanceWrapperDataSchema.extend({
        userId: memberSchema.shape.uuid,
    }).strict();

export type SendEmailToTeamWhenNewMemberSchemaType = z.infer<
    typeof SendEmailToTeamWhenNewMemberSchema
>;

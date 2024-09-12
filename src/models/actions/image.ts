import { z } from "zod";

export const imagePostApiSchema = z.object({
    fileIdentifier: z.enum(["avatar", "shot", "hero", "logo"]),
    fileRelativeObjType: z.enum(["member", "startup", "incubator"]),
    fileObjIdentifier: z.string(),
    fileType: z.enum(["image/jpeg"]),
});

export type imagePostApiSchemaType = z.infer<typeof imagePostApiSchema>;

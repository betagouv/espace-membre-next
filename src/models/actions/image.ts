import { z } from "zod";

export const imagePostApiSchema = z.object({
    fileIdentifier: z.enum(["avatar", "shot", "hero"]),
    fileRelativeObjType: z.enum(["member", "startup"]),
    fileObjIdentifier: z.string(),
    fileType: z.enum(["image/jpeg"]),
});

export type imagePostApiSchemaType = z.infer<typeof imagePostApiSchema>;

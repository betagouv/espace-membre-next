import { z } from "zod";

export const UpdateOvhResponderSchema = z.object({
    account: z.string(),
    content: z.string(),
    copy: z.boolean(),
    from: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Champ obligatoire",
            }),
        })
        .describe("Date de début du message"),
    to: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Champ obligatoire",
            }),
        })
        .describe("Date de fin du message")
        .optional(),
});

export type UpdateOvhResponder = z.infer<typeof UpdateOvhResponderSchema>;

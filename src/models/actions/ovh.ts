import { z } from "zod";

export const UpdateOvhResponderSchema = z.object({
    account: z.string(),
    content: z.string(),
    copy: z.boolean(),
    from: z
        .preprocess(
            (val) => {
                if (typeof val === "string") {
                    return new Date(val);
                }
                return val;
            },
            z.date({
                errorMap: (issue, ctx) => ({
                    message: "Champ obligatoire",
                }),
            })
        )
        .describe("Date de début de mission"),
    to: z
        .preprocess(
            (val) => {
                if (typeof val === "string") {
                    return new Date(val);
                }
                return val;
            },
            z
                .date({
                    errorMap: (issue, ctx) => ({
                        message: "Champ obligatoire",
                    }),
                })

                .optional()
        )
        .describe("Date de fin de mission")
        .optional()
        .nullable(),
});

export type UpdateOvhResponder = z.infer<typeof UpdateOvhResponderSchema>;

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
// Middleware générique pour la validation
export function validate(
    schema: z.ZodSchema,
    property: "body" | "query" | "params"
) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[property]);
        if (!result.success) {
            return res.status(400).json(result.error.flatten());
        }
        next();
    };
}

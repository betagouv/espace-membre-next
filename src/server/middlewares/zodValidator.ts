import { Request, Response, NextFunction } from "express";
import { SafeParseError, z } from "zod";
// Middleware générique pour la validation
export function validate(
    schema: z.ZodSchema,
    property: "body" | "query" | "params"
) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[property]);
        if (!result.success) {
            // Utiliser une assertion de type pour indiquer à TypeScript que `result` est un SafeParseError
            const errorResult = result as SafeParseError<any>;
            return res.status(400).json(errorResult.error.flatten());
        }
        next();
    };
}

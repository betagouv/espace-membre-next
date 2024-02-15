import { Request, Response, NextFunction } from "express";
import { SafeParseError, z } from "zod";
// Middleware générique pour la validation
export function validate(
    schema: z.ZodSchema<any>,
    property: "body" | "query" | "params"
) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[property]);
        if (!result.success) {
            // Si la validation échoue, retourner une erreur 400 avec les détails de l'erreur
            return res.status(400).json(result.error.flatten());
        }

        // Si la validation réussit, remplacer le body, query ou params par le résultat analysé
        req[property] = result.data;

        // Continuer avec le middleware suivant
        next();
    };
}

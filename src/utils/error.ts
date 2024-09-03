import * as Sentry from "@sentry/nextjs";
import slugify from "@sindresorhus/slugify";

import { ActionResponse } from "@/@types/serverAction";
import config from "@/server/config";

const errorMapping = {
    AuthorizationError: 403,
    NoDataError: 404,
    ValidationError: 400,
    OVHError: 502,
    StartupUniqueConstraintViolationError: 409,
    MemberUniqueConstraintViolationError: 409,
};

export const ERROR_MESSAGES = {
    STARTUP_UNIQUE_CONSTRAINT: (name?: string) =>
        name
            ? `Un produit avec le même nom "${name}" existe déjà. Tu peux consulter sa fiche sur <a href="/startups/${slugify(
                  name
              )}">https://${config.host}/startups/${slugify(name)}</a>.`
            : "Un produit avec le même nom existe déjà",
    MEMBER_UNIQUE_CONSTRAINT: (name?: string) =>
        name
            ? `Un utilisateur avec le même nom "${name}" existe déjà. Tu peux consulter sa fiche sur <a target="_blank" href="/community/${slugify(
                  name
              )}">https://${config.host}/community/${slugify(
                  name
              )}</a>. S'il s'agit d'un homomyme, ajoute la première lettre du deuxième prenom de la personne à la suite de son prénom. Ex: Ophélie => Ophélie M.`
            : "Un utilisateur avec le même nom existe déjà",
    AUTHORIZATION_ERROR: "You don’t have the right to access this function.",
    STARTUP_INSERT_FAILED:
        "Startup data could not be inserted into the database.",
    // Add more error messages as needed
};
// errors.ts

export class AuthorizationError extends Error {
    constructor(message: string = ERROR_MESSAGES.AUTHORIZATION_ERROR) {
        super(message);
        this.name = "AuthorizationError";
    }
}

export class NoDataError extends Error {
    constructor(message: string = "Data could not be found") {
        super(message);
        this.name = "NoDataError";
    }
}

export class OVHError extends Error {
    constructor(message: string = "Erreur OVH") {
        super(message);
        this.name = "OVHError";
    }
}

export class ValidationError extends Error {
    constructor(message: string = "Validation failed") {
        super(message);
        this.name = "ValidationError";
    }
}

export class StartupUniqueConstraintViolationError extends Error {
    constructor(startupName?: string) {
        const message = ERROR_MESSAGES.STARTUP_UNIQUE_CONSTRAINT(startupName);
        super(message);
        this.name = "StartupUniqueConstraintViolationError";
    }
}

export class MemberUniqueConstraintViolationError extends Error {
    constructor(username?: string) {
        const message = ERROR_MESSAGES.MEMBER_UNIQUE_CONSTRAINT(username);
        super(message);
        this.name = "MemberUniqueConstraintViolationError";
    }
}

export class StartupInsertFailedError extends Error {
    constructor() {
        super(ERROR_MESSAGES.STARTUP_INSERT_FAILED);
        this.name = "StartupInsertFailedError";
    }
}

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
export function withErrorHandling<T, Args extends any[]>(
    action: (...args: Args) => Promise<T>
): (...args: Args) => Promise<ActionResponse<T>> {
    return async (...args: Args) => {
        try {
            return {
                data: await action(...args),
                message: "success",
                success: true,
            };
        } catch (error) {
            if (
                error instanceof AuthorizationError ||
                error instanceof NoDataError ||
                error instanceof ValidationError ||
                error instanceof OVHError ||
                error instanceof StartupUniqueConstraintViolationError ||
                error instanceof MemberUniqueConstraintViolationError
            ) {
                console.log("Expected error", error);

                // Return a standardized error response
                return {
                    success: false,
                    message: error.message,
                };
            } else {
                // Handle unexpected errors (e.g., log and rethrow)
                console.error("Unexpected error:", error);
                Sentry.captureException(error);
                return {
                    success: false,
                    message: `Une erreur est survenue. Nos équipes ont été notifiées et interviendront
                                dans les meilleurs délais.`,
                };
            }
        }
    };
}

export function withHttpErrorHandling<Args extends any[]>(
    action: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
    return async (...args: Args) => {
        try {
            return await action(...args);
        } catch (error: any) {
            const errorName = error.constructor.name;
            console.log("Error name", errorName);
            if (errorMapping[errorName]) {
                const statusCode = errorMapping[errorName];

                return Response.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    {
                        status: statusCode,
                    }
                );
            } else {
                // Handle unexpected errors\
                console.error("Unexpected error", error);
                Sentry.captureException(error);
                return Response.json(
                    {
                        success: false,
                        message:
                            "Une erreur interne est survenue. Veuillez réessayer plus tard.",
                    },
                    { status: 500 }
                );
            }
        }
    };
}

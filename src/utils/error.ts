import * as Sentry from "@sentry/nextjs";
import slugify from "@sindresorhus/slugify";

import { ActionResponse } from "@/@types/serverAction";
import config from "@/server/config";

export const ERROR_MESSAGES = {
    STARTUP_UNIQUE_CONSTRAINT: (name?: string) =>
        name
            ? `Un produit avec le même nom "${name}" existe déjà. Tu peux consulter sa fiche sur <a href="/startups/${slugify(
                  name
              )}">https://${config.host}/startups/${slugify(name)}</a>.`
            : "Un produit avec le même nom existe déjà",
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
        this.name = "UniqueConstraintViolationError";
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
                error instanceof StartupUniqueConstraintViolationError
            ) {
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

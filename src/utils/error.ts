import * as Sentry from "@sentry/nextjs";

import { ActionResponse } from "@/@types/serverAction";

export class AuthorizationError extends Error {
    constructor(
        message: string = `You don't have the right to access this function`
    ) {
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
                error instanceof OVHError
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

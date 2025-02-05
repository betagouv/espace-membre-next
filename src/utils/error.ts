import * as Sentry from "@sentry/nextjs";
import slugify from "@sindresorhus/slugify";
import { CustomError as LibraryCustomError } from "ts-custom-error";

import { ActionResponse } from "@/@types/serverAction";
import config from "@/server/config";

export const ERROR_MESSAGES = {
    STARTUP_UNIQUE_CONSTRAINT: (name?: string) =>
        name
            ? `Un produit avec le même nom "${name}" existe déjà. Tu peux consulter sa fiche sur <a href="/startups/${slugify(
                  name
              )}">https://${config.host}/startups/${slugify(name)}</a>.`
            : "Un produit avec le même nom existe déjà",
    MEMBER_UNIQUE_CONSTRAINT: (name?: string) =>
        name
            ? `Un utilisateur avec le même nom "${name}" existe déjà. Tu peux consulter sa fiche sur <a target="_blank" href="/community/${name}">https://${config.host}/community/${name}</a>. S'il s'agit d'un homonyme, ajoute la première lettre du deuxième prenom de la personne à la suite de son prénom. Ex: Ophélie => Ophélie M.`
            : "Un utilisateur avec le même nom existe déjà",
    AUTHORIZATION_ERROR: "You don’t have the right to access this function.",
    STARTUP_INSERT_FAILED:
        "Startup data could not be inserted into the database.",
    MEMBER_ADMIN_EMAIL_ADDRESS_NOT_ALLOWED:
        "Les emails admin ne sont pas autorisés",
    // Add more error messages as needed
};
// errors.ts
// TODO replace ErrorWithStatus by businessError
export class CustomError extends LibraryCustomError {
    public constructor(public readonly code: string, message: string = "") {
        super(message);
    }

    public json(): object {
        return {
            code: this.code,
            message: this.message,
        };
    }
}

export class UnexpectedError extends CustomError {}

export class BusinessError extends CustomError {
    public constructor(
        code: string,
        message: string = "",
        public readonly httpCode?: number
    ) {
        super(code, message);
    }
}

export class ErrorWithStatus extends CustomError {
    statusCode: number;
    constructor(message: string) {
        super(message);
        this.statusCode = 500;
    }
}

export class AuthorizationError extends ErrorWithStatus {
    constructor(message: string = ERROR_MESSAGES.AUTHORIZATION_ERROR) {
        super(message);
        this.statusCode = 403;
    }
}

export class NoDataError extends ErrorWithStatus {
    constructor(message: string = "Data could not be found") {
        super(message);
        this.statusCode = 404;
    }
}

export class OVHError extends ErrorWithStatus {
    constructor(message: string = "Erreur OVH") {
        super(message);
        this.statusCode = 502;
    }
}

export class ValidationError extends ErrorWithStatus {
    constructor(message: string = "Validation failed") {
        super(message);
        this.statusCode = 400;
    }
}

export class StartupUniqueConstraintViolationError extends ErrorWithStatus {
    constructor(startupName?: string) {
        const message = ERROR_MESSAGES.STARTUP_UNIQUE_CONSTRAINT(startupName);
        super(message);
        this.statusCode = 409;
    }
}

export class MemberUniqueConstraintViolationError extends ErrorWithStatus {
    constructor(username?: string) {
        const message = ERROR_MESSAGES.MEMBER_UNIQUE_CONSTRAINT(username);
        super(message);
        this.statusCode = 409;
    }
}

export class StartupInsertFailedError extends ErrorWithStatus {
    constructor() {
        super(ERROR_MESSAGES.STARTUP_INSERT_FAILED);
        this.statusCode = 409;
    }
}

export class AdminEmailNotAllowedError extends ErrorWithStatus {
    constructor() {
        super(ERROR_MESSAGES.MEMBER_ADMIN_EMAIL_ADDRESS_NOT_ALLOWED);
        this.statusCode = 403;
        // Ensure the prototype chain is correctly set (for older versions of TypeScript/JavaScript)
        Object.setPrototypeOf(this, AdminEmailNotAllowedError.prototype);
    }
}

export class JobNotFoundError extends ErrorWithStatus {
    constructor() {
        super(ERROR_MESSAGES.MEMBER_ADMIN_EMAIL_ADDRESS_NOT_ALLOWED);
        this.statusCode = 404;
        // Ensure the prototype chain is correctly set (for older versions of TypeScript/JavaScript)
        Object.setPrototypeOf(this, JobNotFoundError.prototype);
    }
}

export class JobCannotBeReplayedError extends ErrorWithStatus {
    constructor() {
        super(ERROR_MESSAGES.MEMBER_ADMIN_EMAIL_ADDRESS_NOT_ALLOWED);
        this.statusCode = 400;
        // Ensure the prototype chain is correctly set (for older versions of TypeScript/JavaScript)
        Object.setPrototypeOf(this, JobCannotBeReplayedError.prototype);
    }
}

const EXPECTED_ERRORS = [
    AuthorizationError,
    NoDataError,
    ValidationError,
    OVHError,
    StartupUniqueConstraintViolationError,
    MemberUniqueConstraintViolationError,
    AdminEmailNotAllowedError,
    BusinessError,
];

function isExpectedError(error: unknown): error is ErrorWithStatus {
    return EXPECTED_ERRORS.some(
        (expectedError) => error instanceof expectedError
    );
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
            if (isExpectedError(error)) {
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
            if (isExpectedError(error)) {
                console.log("Expected error", error);

                return Response.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    {
                        status: error.statusCode || 400,
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

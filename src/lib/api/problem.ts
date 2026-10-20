import { StatusCodes } from "http-status-codes";
import type { ZodError } from "zod";

// RFC 9457. Ce module est importe par le middleware Edge : il ne doit dependre
// ni de Node ni de la base. Zod n'est utilise qu'en type.
export const PROBLEM_MEDIA_TYPE = "application/problem+json";

// L'URI de type est un identifiant stable, pas un document a resoudre : c'est
// sur elle qu'un client branche son traitement, pas sur le libelle.
const PROBLEM_BASE_URI =
  "https://espace-membre.incubateur.net/api/v1/problems/";

export const PROBLEM_TYPES = {
  unauthorized: {
    status: StatusCodes.UNAUTHORIZED,
    title: "Jeton d'API absent, inconnu ou revoque",
  },
  auth_disabled: {
    status: StatusCodes.SERVICE_UNAVAILABLE,
    title: "Authentification par jeton temporairement suspendue",
  },
  insufficient_scope: {
    status: StatusCodes.FORBIDDEN,
    title: "Portee insuffisante pour cette operation",
  },
  out_of_perimeter: {
    status: StatusCodes.FORBIDDEN,
    title: "Ressource hors du perimetre de la clef",
  },
  not_found: {
    status: StatusCodes.NOT_FOUND,
    title: "Ressource introuvable",
  },
  method_not_allowed: {
    status: StatusCodes.METHOD_NOT_ALLOWED,
    title: "Methode non autorisee sur cette ressource",
  },
  conflict: {
    status: StatusCodes.CONFLICT,
    title: "Conflit avec l'etat courant de la ressource",
  },
  unsupported_media_type: {
    status: StatusCodes.UNSUPPORTED_MEDIA_TYPE,
    title: "Type de media non supporte",
  },
  invalid_request: {
    status: StatusCodes.UNPROCESSABLE_ENTITY,
    title: "Requete syntaxiquement correcte mais invalide",
  },
  internal_error: {
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    title: "Erreur interne",
  },
} as const;

export type ProblemType = keyof typeof PROBLEM_TYPES;

// snake_case dans le code, kebab-case dans l'URI publique.
const typeUri = (type: ProblemType) =>
  `${PROBLEM_BASE_URI}${type.replaceAll("_", "-")}`;

export type ProblemInit = {
  detail?: string;
  instance?: string;
  headers?: Record<string, string>;
  extensions?: Record<string, unknown>;
};

export function problem(type: ProblemType, init: ProblemInit = {}): Response {
  const { status, title } = PROBLEM_TYPES[type];
  const body = {
    type: typeUri(type),
    title,
    status,
    ...(init.detail !== undefined && { detail: init.detail }),
    ...(init.instance !== undefined && { instance: init.instance }),
    ...init.extensions,
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": PROBLEM_MEDIA_TYPE, ...init.headers },
  });
}

// 422 a partir d'un ZodError. Chaque probleme est expose en pointeur JSON
// (RFC 6901) : un client genere peut relier l'erreur au champ envoye.
export function invalidRequest(error: ZodError, init: ProblemInit = {}) {
  return problem("invalid_request", {
    ...init,
    detail:
      init.detail ??
      "Le corps ou les parametres de la requete ne satisfont pas le contrat.",
    extensions: {
      ...init.extensions,
      errors: error.issues.map((issue) => ({
        pointer: `/${issue.path.join("/")}`,
        code: issue.code,
        detail: issue.message,
      })),
    },
  });
}

export function unsupportedMediaType(accepted: string[], instance?: string) {
  return problem("unsupported_media_type", {
    instance,
    detail: `Types acceptes : ${accepted.join(", ")}.`,
    headers: { Accept: accepted.join(", ") },
  });
}

// Next repond nativement 405 aux verbes non exportes, mais avec un corps vide.
// Cette fabrique permet d'exporter explicitement les verbes plausibles pour que
// la reponse reste en problem+json comme le reste de l'API.
export const methodNotAllowed = (allowed: string[]) => async (req: Request) =>
  problem("method_not_allowed", {
    instance: new URL(req.url).pathname,
    detail: `Methodes autorisees : ${allowed.join(", ")}.`,
    headers: { Allow: allowed.join(", ") },
  });

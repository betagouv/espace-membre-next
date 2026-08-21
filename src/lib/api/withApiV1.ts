import * as Sentry from "@sentry/nextjs";
import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { isOwnerExpired } from "@/lib/api-keys/ownerExpiration";
import { hashApiKeyToken } from "@/lib/api-keys/token";
import { extractBearerToken } from "@/lib/api/bearer";
import {
  invalidRequest,
  problem,
  unsupportedMediaType,
} from "@/lib/api/problem";
import { findApiKeyByHash, touchApiKey } from "@/lib/kysely/queries/apiKeys";
import { apiKeyContextRowSchema } from "@/models/api/apiKey";
import {
  ApiPerimeter,
  PerimeterLabel,
  perimeterLabelSchema,
} from "@/models/api/perimeter";
import { ApiScope } from "@/models/api/scope";
import {
  getBlockedApiKeyUsers,
  isApiKeyAuthDisabled,
} from "@/server/config/apiKeys.config";

export type ApiKeyContext = {
  uuid: string;
  kind: "personal" | "service";
  tokenPrefix: string;
  scopes: ApiScope[];
  has: (scope: ApiScope) => boolean;
  read: ApiPerimeter;
  readLabel: PerimeterLabel;
  write: ApiPerimeter | null;
  writeLabel: PerimeterLabel | null;
  ownerUserId: string | null;
  ownerIncubatorId: string | null;
};

type ApiKeyRow = NonNullable<Awaited<ReturnType<typeof findApiKeyByHash>>>;

const unauthorized = (detail: string, error: string) =>
  problem("unauthorized", {
    detail,
    headers: {
      "WWW-Authenticate": `Bearer realm="espace-membre", error="${error}"`,
    },
  });

function toPerimeter(
  kind: string | null,
  id: string | null,
  ghid: string | null,
): { perimeter: ApiPerimeter; label: PerimeterLabel } | null {
  if (kind === "global") return { perimeter: { kind: "global" }, label: "global" };
  if ((kind !== "incubator" && kind !== "startup") || !id) return null;
  // Perimetre orphelin : la cible a ete supprimee (aucune clef etrangere) et le
  // balayage quotidien n'est pas encore passe. Ni repli sur l'uuid, ni repli sur
  // global : la clef est refusee jusqu'a sa revocation.
  if (!ghid) return null;
  const label = `${kind}/${ghid}`;
  if (!perimeterLabelSchema.safeParse(label).success) return null;
  return { perimeter: { kind, uuid: id }, label };
}

/**
 * Conversion validante d'une ligne api_keys. kysely-codegen ne rend que
 * `string` et `string[]` pour kind, scopes et les perimetres : la base ne
 * garantit que ses CHECK, et un CHECK peut avoir ete pose avant qu'un scope ne
 * soit retire de l'enumeration. Rend `null` au lieu de jeter, pour que
 * l'appelant choisisse le code de statut et que le rejet tombe AVANT
 * touchApiKey : une clef refusee ne met pas a jour son last_used_at.
 */
function toApiKeyContext(row: ApiKeyRow): ApiKeyContext | null {
  const parsed = apiKeyContextRowSchema.safeParse({
    kind: row.kind,
    scopes: row.scopes,
  });
  if (!parsed.success) return null;

  const read = toPerimeter(
    row.read_perimeter_kind,
    row.read_perimeter_id,
    row.read_perimeter_ghid,
  );
  if (!read) return null;

  // write_perimeter_kind a NULL = clef sans ecriture, cas legitime.
  const write = row.write_perimeter_kind
    ? toPerimeter(
        row.write_perimeter_kind,
        row.write_perimeter_id,
        row.write_perimeter_ghid,
      )
    : null;
  if (row.write_perimeter_kind && !write) return null;

  const { kind, scopes } = parsed.data;
  return {
    uuid: row.uuid,
    kind,
    tokenPrefix: row.token_prefix,
    scopes,
    has: (scope) => scopes.includes(scope),
    read: read.perimeter,
    readLabel: read.label,
    write: write?.perimeter ?? null,
    writeLabel: write?.label ?? null,
    ownerUserId: row.owner_user_id,
    ownerIncubatorId: row.owner_incubator_id,
  };
}

export async function authenticateApiKey(
  req: NextRequest,
): Promise<{ ok: true; key: ApiKeyContext } | { ok: false; response: Response }> {
  if (isApiKeyAuthDisabled()) {
    return {
      ok: false,
      response: problem("auth_disabled", {
        detail: "L'authentification par jeton est temporairement coupee.",
        headers: { "Retry-After": "3600" },
      }),
    };
  }

  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) {
    return {
      ok: false,
      response: unauthorized("Jeton absent ou malforme.", "invalid_request"),
    };
  }

  // Etat de la clef : relu a chaque requete, jamais mis en cache.
  const row = await findApiKeyByHash(hashApiKeyToken(token));
  if (!row)
    return { ok: false, response: unauthorized("Clef inconnue.", "invalid_token") };
  if (row.revoked_at) {
    return {
      ok: false,
      response: unauthorized("Clef revoquee.", "invalid_token"),
    };
  }
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
    return {
      ok: false,
      response: unauthorized("Clef expiree.", "invalid_token"),
    };
  }

  if (row.kind === "personal") {
    // Liste relue a chaque requete : un blocage prend effet immediatement, sans
    // attendre le job.
    if (
      row.owner_username &&
      getBlockedApiKeyUsers().includes(row.owner_username)
    ) {
      return {
        ok: false,
        response: unauthorized("Porteur bloque.", "invalid_token"),
      };
    }
    if (isOwnerExpired(row.owner_user_id!, row.owner_missions)) {
      return {
        ok: false,
        response: unauthorized("Porteur expire.", "invalid_token"),
      };
    }
  }

  // Dernier etage, et le seul qui puisse echouer sur l'etat de la BASE plutot
  // que sur celui de la clef. Il precede touchApiKey a dessein.
  const key = toApiKeyContext(row);
  if (!key) {
    return {
      ok: false,
      response: unauthorized(
        "Clef inexploitable : portee hors enumeration, ou perimetre dont la cible a disparu.",
        "invalid_token",
      ),
    };
  }

  await touchApiKey(row.uuid, row.last_used_at);
  return { ok: true, key };
}

// Aucune exception ne doit sortir d'une route v1 : sans filet, Next rend sa
// reponse d'erreur par defaut, hors contrat application/problem+json.
const PG_CONFLICT_CODES = new Set([
  "23505", // violation d'unicite
  "23503", // clef etrangere, dont la contrainte differee
  //          startups_principal_incubator_linked, qui ne leve qu'au COMMIT
  "23514", // CHECK
]);

// Erreurs de SAISIE que Postgres detecte, donc a rendre en 422 et pas en 500 :
// un 500 est indiscernable d'une panne, il declenche les reessais du client et
// une alerte Sentry pour ce qui est une requete invalide. Les schemas bornent
// deja les colonnes varchar(255), ce filet couvre ce qu'ils rateraient.
const PG_INPUT_CODES = new Map([
  ["22001", "Une valeur depasse la longueur autorisee par la base."],
  ["22P02", "Une valeur n'a pas le format attendu par la base."],
  ["22007", "Une date n'a pas un format valide."],
]);

function toProblemResponse(error: unknown, instance: string): Response {
  if (error instanceof ZodError) return invalidRequest(error, { instance });

  // req.json() leve un SyntaxError sur un corps tronque ou vide. C'est une
  // requete invalide du client, pas une erreur interne.
  if (error instanceof SyntaxError) {
    return problem("invalid_request", {
      instance,
      detail: "Le corps de la requete n'est pas un document JSON valide.",
    });
  }

  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code === "string" && PG_INPUT_CODES.has(code)) {
    return problem("invalid_request", {
      instance,
      detail: PG_INPUT_CODES.get(code)!,
    });
  }
  if (typeof code === "string" && PG_CONFLICT_CODES.has(code)) {
    return problem("conflict", {
      instance,
      detail: "L'ecriture viole une contrainte d'integrite de la base.",
      extensions: {
        constraint: (error as { constraint?: string }).constraint ?? null,
      },
    });
  }

  Sentry.captureException(error);
  return problem("internal_error", {
    instance,
    detail: "Une erreur interne est survenue.",
  });
}

type Handler<P> = (
  req: NextRequest,
  ctx: { params: P; key: ApiKeyContext },
) => Promise<Response>;

export function withApiV1<
  P extends Record<string, string> = Record<string, never>,
>(options: { scope: ApiScope; mediaTypes?: string[] }, handler: Handler<P>) {
  // segmentData est optionnel : une route de collection n'a pas de segment
  // dynamique, et Next ne lui passe alors pas de params.
  return async (req: NextRequest, segmentData?: { params: Promise<P> }) => {
    try {
      const auth = await authenticateApiKey(req);
      if (!auth.ok) return auth.response;

      if (options.mediaTypes) {
        const received = (req.headers.get("content-type") ?? "")
          .split(";")[0]
          .trim()
          .toLowerCase();
        if (!options.mediaTypes.includes(received)) {
          return unsupportedMediaType(options.mediaTypes, req.nextUrl.pathname);
        }
      }

      if (!auth.key.has(options.scope)) {
        return problem("insufficient_scope", {
          instance: req.nextUrl.pathname,
          detail: `Cette operation exige la portee ${options.scope}.`,
          extensions: { required_scope: options.scope },
          headers: {
            "WWW-Authenticate": `Bearer error="insufficient_scope", scope="${options.scope}"`,
          },
        });
      }

      // `await` obligatoire : sans lui, une promesse rejetee sort du try.
      return await handler(req, {
        params: ((await segmentData?.params) ?? {}) as P,
        key: auth.key,
      });
    } catch (error) {
      return toProblemResponse(error, req.nextUrl.pathname);
    }
  };
}

/** Pour /api/v1/openapi.json : aucune clef, mais un wrapper
 *  quand meme, pour satisfaire le test de garde et pour le meme filet. */
export function publicApiV1(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      return toProblemResponse(error, req.nextUrl.pathname);
    }
  };
}

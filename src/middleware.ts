import { StatusCodes } from "http-status-codes";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

import { extractBearerToken } from "./lib/api/bearer";
import { problem } from "./lib/api/problem";
import { getArrayFromEnv } from "./lib/env";

interface UserJwtPayload {
  jti: string;
  iat: number;
  exp: number;
}

export async function verifyAuth(req: NextRequest) {
  const token = (
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token")
  )?.value;

  if (!token) throw new Error(`Missing user token for ${req.url}`);

  try {
    // here we use jwtVerify from jose, because jwt verify from jsonwebtoken use
    // node crypto api which cannot be use in "Edge Runtime" for the time being
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.SESSION_SECRET!),
      {
        algorithms: ["HS512"], // Assurez-vous que l'algorithme correspond à celui utilisé pour signer le token
      },
    );
    return verified.payload as UserJwtPayload;
  } catch (err) {
    throw new Error("Your token has expired.");
  }
}

// Allow having apex domain and subdomains
// e.g. https://ademe.fr, https://www.ademe.fr, https://subdomain.ademe.fr
const allowedOrigins = getArrayFromEnv("PROTECTED_API_ALLOWED_ORIGINS", [
  "gouv.fr",
  "ademe.fr",
  "incubateur.net",
]).flatMap((origin) =>
  origin === "*"
    ? /https:\/\/.*/
    : [
        new RegExp(String.raw`https://.*\.${origin}`),
        new RegExp(`https://${origin}`),
      ],
);

const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  // Authorization est un « CORS non-wildcard request-header name » : l'etoile
  // ne le couvre pas, le navigateur exige son nom en clair dans le preflight.
  // Sans lui, aucun appel navigateur a /api/v1 ne peut aboutir.
  "Access-Control-Allow-Headers": "Authorization, Content-Type, *",
};

function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const isAllowedOrigin = allowedOrigins.some((allowedOrigin) =>
    allowedOrigin.test(origin),
  );

  return {
    ...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
    ...corsOptions,
  };
}

// La spec et sa page de doc sont publiques : ni session ni jeton.
// La page de documentation a quitte /api/v1 pour /api/docs : elle n'est plus une
// route d'API mais une page, exclue du config.matcher plus bas.
const API_V1_PUBLIC_PATHS = new Set(["/api/v1/openapi.json"]);

// Branche soeur de l'ancienne branche /api/protected/. Le middleware tourne en
// Edge : il ne peut pas joindre Postgres, donc il ne fait ici que le CORS et un
// rejet de surface. La verification reelle (etat de la clef, porteur, portees,
// perimetre) se fait dans withApiV1, en runtime Node.
async function handleApiV1Route(req: NextRequest) {
  const headers = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: StatusCodes.NO_CONTENT, headers });
  }

  const forward = () => {
    const response = NextResponse.next();
    Object.entries(headers).forEach(([key, value]) =>
      response.headers.set(key, value),
    );
    return response;
  };

  if (API_V1_PUBLIC_PATHS.has(req.nextUrl.pathname)) return forward();

  // Defense en profondeur, sans base : une requete sans jeton bien forme n'a
  // aucune chance d'aboutir, autant ne pas la laisser atteindre le pool pg.
  // extractBearerToken est le MEME code que celui du wrapper : les deux etages
  // ne peuvent pas diverger.
  if (!extractBearerToken(req.headers.get("authorization"))) {
    return problem("unauthorized", {
      detail:
        "Un jeton d'API est requis : en-tete Authorization: Bearer em1_...",
      instance: req.nextUrl.pathname,
      headers: {
        ...headers,
        "WWW-Authenticate":
          'Bearer realm="espace-membre", error="invalid_request"',
      },
    });
  }

  return forward();
}

export async function middleware(req: NextRequest) {
  // API v1 : authentification par jeton, jamais par session. Cette branche doit
  // rester AVANT le controle de session ci-dessous et RETOURNER, sinon une
  // requete portant un cookie valide passerait par un autre chemin
  // d'autorisation que celle qui n'en porte pas.
  if (req.nextUrl.pathname.startsWith("/api/v1/")) {
    return handleApiV1Route(req);
  }

  // validate the user is authenticated
  const verifiedToken = await verifyAuth(req).catch((err) => {
    console.error(err.message);
  });

  if (!verifiedToken) {
    // if this an API request, respond with JSON
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({
          error: { message: "authentication required" },
        }),
        { status: StatusCodes.UNAUTHORIZED },
      );
    }
    // otherwise, redirect to the set token page
    else {
      // /!\ redirecting to pathname as req.url always use localhost:3000 as hostname
      return NextResponse.redirect(
        new URL(`/login?next=${req.nextUrl.pathname}`, req.url),
      );
    }
  }
}

// `api/docs` est la page de documentation publique. Elle n'est pas servie par la
// branche publique du middleware, qui ne reconnait que le prefixe versionne :
// sans son exclusion du matcher ci-dessous, elle repondrait 401 JSON, et pas
// meme une redirection vers /login, son chemin commencant par `/api/`.
// Le commentaire vit ICI et non dans le tableau : la garde de
// __tests__/test-api-guard.ts verifie que le matcher n'exclut jamais la surface
// versionnee, et elle lit le bloc `matcher: [...]` en entier, commentaires
// compris.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - public routes
     * - api/hook
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    // "/dashboard",
    "/((?!accessibilite|keskispasse|components|login|signin|api/docs|api/hook|api/auth|api/public|static/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

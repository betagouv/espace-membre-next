import { HttpStatusCode } from 'axios';
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

import { getArrayFromEnv } from './lib/env';

interface UserJwtPayload {
    jti: string;
    iat: number;
}

export async function verifyAuth(req: NextRequest) {
    const token = (
        req.cookies.get("next-auth.session-token") ||
        req.cookies.get("__Secure-next-auth.session-token")
    )?.value;

    if (!token) throw new Error("Missing user token");

    try {
        // here we use jwtVerify from jose, because jwt verify from jsonwebtoken use
        // node crypto api which cannot be use in "Edge Runtime" for the time being
        const verified = await jwtVerify(
            token,
            new TextEncoder().encode(process.env.SESSION_SECRET!),
            {
                algorithms: ["HS512"], // Assurez-vous que l'algorithme correspond à celui utilisé pour signer le token
            }
        );
        return verified.payload as UserJwtPayload;
    } catch (err) {
        throw new Error("Your token has expired.");
    }
}

// Allow having apex domain and subdomains
// e.g. https://ademe.fr, https://www.ademe.fr, https://subdomain.ademe.fr
const allowedOrigins = getArrayFromEnv("PROTECTED_API_ALLOWED_ORIGINS", ["gouv.fr", "ademe.fr"]).flatMap((origin) => origin === "*" ? /https:\/\/.*/ : [
    new RegExp(`https://.*\\.${origin}`),
    new RegExp(`https://${origin}`),
]);

const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

function getCorsHeaders(req: NextRequest): Record<string, string> {
    const origin = req.headers.get('origin') ?? '';
    const isAllowedOrigin = allowedOrigins.some((allowedOrigin) => allowedOrigin.test(origin));

    return {
            ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
            ...corsOptions,
        };
}

export async function middleware(req: NextRequest) {
    // control protected routes
    if (req.nextUrl.pathname.startsWith("/api/protected/")) {
        const headers = getCorsHeaders(req);
        if (req.method === "OPTIONS") { // preflight request
            return NextResponse.json({}, { headers });
        }

        const PROTECTED_API_KEYS = getArrayFromEnv("PROTECTED_API_KEYS")
        if (!req.nextUrl.searchParams.has("apiKey")) {
            return NextResponse.json({ error: { message: "Api key is required." }}, { status: HttpStatusCode.UnprocessableEntity, headers });
        }
        const apiKey = req.nextUrl.searchParams.get('apiKey') ?? "";
        if (!PROTECTED_API_KEYS.includes(apiKey)) {
            return NextResponse.json({ error: { message: "Invalid api key." }}, { status: HttpStatusCode.Unauthorized, headers });
        }

        const response = NextResponse.next();
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        return response;
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
                { status: HttpStatusCode.Unauthorized }
            );
        }
        // otherwise, redirect to the set token page
        else {
            return NextResponse.redirect(
                new URL(`/login?next=${req.url}`, req.url)
            );
        }
    }
}

// See "Matching Paths" below to learn more
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
        "/((?!keskispasse|components|login|signin|api/hook|api/auth|static/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};

import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

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

export async function middleware(req: NextRequest) {
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
                { status: 401 }
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
        "/((?!keskispasse|login|signin|api/hook|api/auth|static/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};

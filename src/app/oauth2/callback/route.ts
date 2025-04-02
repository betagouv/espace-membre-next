import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth/next";

import { authOptions } from "@/utils/authoptions";

const nextAuth = NextAuth(authOptions);

const handler = (req: NextRequest, res: NextResponse) => {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const iss = url.searchParams.get("iss");
    const state = url.searchParams.get("state");

    const redirectUrl =
        process.env.NEXTAUTH_URL +
        `/api/auth/callback/proconnect?code=${code}&iss=${encodeURIComponent(
            iss || ""
        )}&state=${state}`;

    return NextResponse.redirect(redirectUrl);
};

const headHandler = (req: NextRequest, res) => {
    return new Response("Success!", {
        status: 200,
    });
};

export { handler as GET, handler as POST, headHandler as HEAD };

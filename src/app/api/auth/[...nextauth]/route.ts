import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth/next";

import { authOptions } from "@/utils/authoptions";

const nextAuth = NextAuth(authOptions);

const handler = (req: NextRequest, res: NextResponse) => {
    return nextAuth(req, res);
};

const headHandler = (req: NextRequest, res) => {
    return new Response("Success!", {
        status: 200,
    });
};

export { handler as GET, handler as POST, headHandler as HEAD };

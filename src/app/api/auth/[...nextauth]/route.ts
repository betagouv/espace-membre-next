import { NextRequest } from "next/server";
import NextAuth from "next-auth/next";

import { authOptions } from "@/utils/authoptions";

const nextAuth = NextAuth(authOptions);

const handler = (req: NextRequest, res) => {
    return nextAuth(req, res);
};

export { handler as GET, handler as POST };

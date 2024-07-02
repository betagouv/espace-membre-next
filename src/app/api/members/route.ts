import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";

import { searchUsers } from "@/lib/kysely/queries/search";
import { authOptions } from "@/utils/authoptions";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    const { searchParams } = new URL(req.url);
    const users = await searchUsers(searchParams);
    const data = { users };
    return Response.json(data);
}

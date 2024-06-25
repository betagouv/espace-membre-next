import { NextRequest } from "next/server";
import { searchUsers } from "@/lib/kysely/queries/users";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const users = await searchUsers(searchParams);
    const data = { users };
    return Response.json(data);
}

import { getServerSession } from "next-auth";
import { db } from "@/lib/kysely";
import { authOptions } from "@/utils/authoptions";
import { NextRequest } from "next/server";

export async function GET(
    req: NextRequest,
    { params: { id } }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id || !id) {
        throw new Error(`You don't have the right to access this function`);
    }
    // todo: ensure user can download files here
    const file = await db
        .selectFrom("startups_files")
        .select(["filename", "base64"])
        .where("uuid", "=", id)
        .where("deleted_at", "is", null)
        .executeTakeFirstOrThrow();

    if (file.base64) {
        const decoded = file.base64.toString().split(",").slice(1).join(""); // remove base64 header
        const resp = Buffer.from(decoded, "base64");
        return new Response(resp);
    }
    const resp = new Response("404", { status: 404 });
}

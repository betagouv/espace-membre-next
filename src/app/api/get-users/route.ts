import { getUsers } from "@/controllers/adminController/getUsers";
import { NextRequest } from "next/server";
import { getServerSession } from "@/proxies/next-auth";

function paramsToObject(entries) {
    const result = {};
    for (const [key, value] of entries) {
        // each 'entry' is a [key, value] tupple
        result[key] = value;
    }
    return result;
}
export async function GET(
    req: NextRequest,
    { params }: { params: { username: string } }
) {
    const session = await getServerSession();
    return await getUsers(
        {
            query: paramsToObject(req.nextUrl.searchParams.entries()),
            get: (key: string) => req.headers.get(key),
            auth: { id: session?.user?.name },
        },
        Response
    );
}

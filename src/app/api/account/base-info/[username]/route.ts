import { publicPostBaseInfoUpdate } from "@/controllers/usersController/baseInfo/publicPostBaseInfoUpdate";
import { getServerSession } from "@/proxies/next-auth";
import { NextRequest } from "next/server";

export async function POST(
    req: NextRequest,
    { params }: { params: { username: string } }
) {
    console.log(req);
    const body = process.env.NODE_ENV === "test" ? req.body : await req.json();
    const session = await getServerSession();

    return await publicPostBaseInfoUpdate(
        {
            body,
            params: {
                username: params.username,
            },
            auth: {
                id: session?.user?.name,
            },
        },
        Response
    );
}

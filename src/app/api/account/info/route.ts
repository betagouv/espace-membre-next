import { postBaseInfoUpdate } from "@/controllers/usersController/baseInfo/postBaseInfoUpdate";
import { getServerSession } from "next-auth";

export async function POST(
    req: Request,
    { params }: { params: { username: string } }
) {
    const body = await req.json();
    const session = await getServerSession();
    return await postBaseInfoUpdate(
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

import { updatePasswordForUser } from "@/controllers/usersController/updatePasswordForUser";
import { getServerSession } from "@/proxies/next-auth";

export async function POST(
    req: Request,
    { params }: { params: { username: string } }
) {
    const body = await req.json();
    const session = await getServerSession();

    return await updatePasswordForUser(
        {
            body,
            auth: { id: session?.user?.name },
            params,
        },
        Response
    );
}

import { managePrimaryEmailForUser } from "@/controllers/usersController/managePrimaryEmailForUser";
import { getServerSession } from "@/proxies/next-auth";

export async function PUT(
    req: Request,
    { params }: { params: { username: string } }
) {
    const body = await req.json();
    const session = await getServerSession();

    return await managePrimaryEmailForUser(
        {
            body,
            auth: { id: session?.user?.name },
            params,
        },
        Response
    );
}

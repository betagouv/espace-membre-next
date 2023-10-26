import { createRedirectionForUser } from "@/controllers/usersController/createRedirectionForUser";
import { deleteRedirectionForUser } from "@/controllers/usersController/deleteRedirectionForUser";
import { getServerSession } from "next-auth";

export async function DELETE(
    req: Request,
    { params }: { params: { username: string } }
) {
    const body = await req.json();
    const session = await getServerSession();

    return await deleteRedirectionForUser(
        {
            body,
            auth: { id: session?.user?.name },
            params,
        },
        Response
    );
}

export async function POST(
    req: Request,
    { params }: { params: { username: string } }
) {
    const body = await req.json();
    const session = await getServerSession();

    return await createRedirectionForUser(
        {
            body,
            auth: { id: session?.user?.name },
            params,
        },
        Response
    );
}

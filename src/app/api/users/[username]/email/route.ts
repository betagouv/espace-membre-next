import {
    createRedirectionForUser,
    deleteRedirectionForUser,
} from "@/controllers/usersController";
import { getServerSession } from "next-auth";

export async function DELETE(
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

export async function POST(
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

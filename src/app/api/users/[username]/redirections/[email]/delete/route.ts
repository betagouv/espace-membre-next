import { deleteRedirectionForUser } from "@/controllers/usersController/deleteRedirectionForUser";
import { getServerSession } from "next-auth";

export async function DELETE(
    req: Request,
    { params }: { params: { username: string } }
) {
    const session = await getServerSession();

    // const body = await req.json();
    return await deleteRedirectionForUser(
        {
            auth: { id: session?.user?.name },
            params,
        },
        Response
    );
}

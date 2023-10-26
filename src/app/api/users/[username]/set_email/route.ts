import { setEmailResponder } from "@/controllers/accountController/setEmailResponder";
import { deleteEmailResponder } from "@/controllers/accountController/deleteEmailResponder";
import { getServerSession } from "next-auth";

export async function DELETE(
    req: Request,
    { params }: { params: { username: string } }
) {
    const body = await req.json();
    const session = await getServerSession();

    return await deleteEmailResponder(
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

    return await setEmailResponder(
        {
            body,
            auth: { id: session?.user?.name },
            params,
        },
        Response
    );
}

import { getCurrentUser } from "@/controllers/accountController";
import { getServerSession } from "next-auth";
export async function GET(
    req: Request,
    { params }: { params: { username: string } }
) {
    const session = await getServerSession();

    return getCurrentUser(
        {
            auth: { id: session?.user?.name },
        },
        Response
    );
}

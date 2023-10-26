import { postForm } from "@/controllers/onboardingController";
import { getServerSession } from "next-auth";

export async function POST(
    req: Request,
    { params }: { params: { username: string } }
) {
    const body = await req.json();
    const session = await getServerSession();

    return await postForm(
        {
            body,
            auth: { id: session?.user?.name },
            params,
        },
        Response
    );
}

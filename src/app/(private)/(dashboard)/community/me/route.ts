import { authOptions } from "@/utils/authoptions";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

export async function GET(req) {
    const session = await getServerSession(authOptions);

    if (!session)
        throw new Error(`You don't have the right to access this function`);

    return redirect(`/community/${session.user.id}`);
}

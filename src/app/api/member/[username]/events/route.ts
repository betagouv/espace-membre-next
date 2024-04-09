import { getServerSession } from "next-auth";

import { getEventListByUsername } from "@/lib/events";
import { authOptions } from "@/utils/authoptions";

export async function GET(
    req: Request,
    {
        params: { username },
    }: {
        params: {
            username: string;
        };
    }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    if (!session.user.isAdmin) {
        throw new Error(`User should be admin or should owned data`);
    }

    let events = await getEventListByUsername(username);

    return Response.json(events);
}

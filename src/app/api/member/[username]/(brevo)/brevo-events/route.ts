import { getServerSession } from "next-auth";

import {
    brevoEmailEventDataSchema,
    emailEventSchema,
} from "@/models/brevoEvent";
import db from "@/server/db";
import { getSendEventForUser } from "@/server/infra/email/sendInBlue";
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

    const dbUser = await db("users")
        .where({
            username,
        })
        .first();
    const resp = {
        primary_email: {},
        secondary_email: {},
    };
    if (dbUser.primary_email) {
        resp.primary_email = {
            email: dbUser.primary_email,
            events: [],
            error: null,
        };
        try {
            resp.primary_email["events"] = await getSendEventForUser(
                dbUser.primary_email
            );
        } catch (e) {
            resp.primary_email["error"] = e;
        }
    }
    if (dbUser.secondary_email) {
        resp.secondary_email = {
            email: dbUser.secondary_email,
            events: [],
            error: null,
        };
        try {
            resp.secondary_email["events"] = await getSendEventForUser(
                dbUser.secondary_email
            );
        } catch (e) {
            resp.secondary_email["error"] = e;
        }
    }
    return Response.json(brevoEmailEventDataSchema.parse(resp));
}

import { getServerSession } from "next-auth";

import { matomoInfoDataSchema } from "@/models/matomoInfo";
import db from "@/server/db";
import { authOptions } from "@/utils/authoptions";

const matomoUrl = `https://stats.beta.gouv.fr/`;
const tokenAuth = process.env.MATOMO_TOKEN;

const getUser = async (email) => {
    const url = `${matomoUrl}?module=API&method=UsersManager.getUser&format=JSON&token_auth=${tokenAuth}&userLogin=${email}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to fetch users");
        }
        const user = await response.json();
        return user;
    } catch (error) {
        console.error("Error fetching users:", error);
        return null;
    }
};

const findUserByEmail = async (email) => {
    const user = await getUser(email);
    if (!user || user.result === "error") {
        console.log("No users found or error fetching users");
        return;
    }
    if (user) {
        console.log("User Found:", user);
    } else {
        console.log("User not found");
    }
    return user;
};

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
        primaryEmail: {},
        secondaryEmail: {},
    };
    if (dbUser.primary_email) {
        resp.primaryEmail = {
            email: dbUser.primary_email,
            events: [],
            error: null,
        };
        try {
            resp.primaryEmail = await findUserByEmail(dbUser.primary_email);
        } catch (e) {
            resp.primaryEmail["error"] = e;
        }
    }
    if (dbUser.secondary_email) {
        resp.secondaryEmail = {
            email: dbUser.secondary_email,
            events: [],
            error: null,
        };
        try {
            resp.secondaryEmail = await findUserByEmail(
                "lucas.charrier" || dbUser.secondary_email
            );
        } catch (e) {
            resp.secondaryEmail["error"] = e;
        }
    }
    console.log("lcs matomo", resp);
    return Response.json(matomoInfoDataSchema.parse(resp));
}

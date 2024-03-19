import { cookies } from "next/headers";

import { createOrUpdateMemberData } from "./createOrUpdateMemberData";
import { EmailStatusCode } from "@/models/dbUser";
import { createMemberSchema } from "@/models/member";
import config from "@/server/config";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import { createUsername } from "@/utils/github";

export async function POST(req: Request) {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    const data = await req.json();

    const { firstname, lastname, email, missions, ...postParams } =
        createMemberSchema.parse(data);
    const username = createUsername(firstname, lastname);
    const githubData = {
        ...postParams,
        fullname: `${firstname} ${lastname}`,
        role: `${postParams.domaine}`,
        missions,
        bio: "",
    };

    const dbData = {
        username,
        secondary_email: email,
        primary_email_status: EmailStatusCode.EMAIL_WAITING_VERIFICATION,
    };

    const prInfo = await createOrUpdateMemberData(
        {
            username,
            method: `create`,
            author: session.id,
        },
        githubData,
        dbData,
        undefined
    );

    return Response.json({
        message: `Success`,
        pr_url: prInfo.html_url,
    });
}

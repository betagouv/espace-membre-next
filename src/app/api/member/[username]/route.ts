import { cookies } from "next/headers";

import { createOrUpdateMemberData } from "../createOrUpdateMemberData";
import { EmailStatusCode, MemberType } from "@/models/dbUser";
import { completeMemberSchema, memberSchemaType } from "@/models/member";
import config from "@/server/config";
import { isPublicServiceEmail } from "@/server/controllers/utils";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";

export async function PUT(
    req: Request,
    { params: { username } }: { params: { username: string } }
) {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    if (!session || session.id !== username) {
        throw new Error(`You don't have the right to access this function`);
    }
    const data = await req.json();
    let {
        osm_city,
        workplace_insee_code,
        gender,
        secondary_email,
        legal_status,
        average_nb_of_days,
        tjm,
        bio,
        memberType,
        ...postParams
    } = completeMemberSchema.parse({
        ...data,
        username,
    });

    let primary_email;
    const hasPublicServiceEmail = await isPublicServiceEmail(secondary_email);
    if (hasPublicServiceEmail) {
        primary_email = secondary_email;
        secondary_email = undefined;
    }

    const primary_email_status = primary_email
        ? EmailStatusCode.EMAIL_ACTIVE
        : EmailStatusCode.EMAIL_CREATION_WAITING;

    const privateData = {
        tjm,
        gender,
        average_nb_of_days,
    };

    const dbData = {
        username,
        primary_email,
        workplace_insee_code,
        legal_status,
        secondary_email,
        primary_email_status,
        primary_email_status_updated_at: new Date(),
        should_create_marrainage: false,
        email_is_redirection: memberType === MemberType.ATTRIBUTAIRE,
        osm_city,
    };

    const githubData: memberSchemaType = {
        ...postParams,
        bio,
        memberType,
        role: `${postParams.domaine}`,
    };

    const prInfo = await createOrUpdateMemberData(
        {
            author: session.id,
            method: "update",
            username,
        },
        githubData,
        dbData,
        privateData
    );

    return Response.json({
        message: `Success`,
        pr_url: prInfo.html_url,
    });
}

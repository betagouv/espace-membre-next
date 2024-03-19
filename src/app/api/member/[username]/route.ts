import { cookies } from "next/headers";

import { createOrUpdateMemberData } from "../createOrUpdateMemberData";
import { EmailStatusCode } from "@/models/dbUser";
import {
    completeMemberSchema,
    createMemberSchema,
    memberSchemaType,
} from "@/models/member";
import config from "@/server/config";
import {
    makeGithubAuthorFile,
    updateMultipleFilesPR,
} from "@/server/controllers/helpers/githubHelpers";
import { computeHash, isPublicServiceEmail } from "@/server/controllers/utils";
import db from "@/server/db";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";

export async function PUT(req: Request) {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    const data = await req.json();
    let {
        username,
        osm_city,
        workplace_insee_code,
        gender,
        secondary_email,
        legal_status,
        average_nb_of_days,
        tjm,
        bio,
        ...postParams
    } = completeMemberSchema.parse(data);

    let primary_email;
    const hasPublicServiceEmail = await isPublicServiceEmail(secondary_email);
    if (hasPublicServiceEmail) {
        primary_email = secondary_email;
        secondary_email = undefined;
    }

    const primary_email_status = primary_email
        ? EmailStatusCode.EMAIL_UNSET
        : EmailStatusCode.EMAIL_ACTIVE;

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
        osm_city,
    };

    const githubData: memberSchemaType = {
        ...postParams,
        bio,
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

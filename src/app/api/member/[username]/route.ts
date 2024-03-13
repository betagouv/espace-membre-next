import { cookies } from "next/headers";

import { EmailStatusCode } from "@/models/dbUser";
import { completeMemberSchema, createMemberSchema } from "@/models/member";
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
    const {
        username,
        osm_city,
        workplace_insee_code,
        gender,
        email,
        legal_status,
        // isEmailBetaAsked,
        average_nb_of_days,
        tjm,
        bio,
        ...postParams
    } = completeMemberSchema.parse(data);
    const files = [
        makeGithubAuthorFile(
            username,
            {
                ...postParams,
            },
            bio || ""
        ),
    ];
    const prInfo = await updateMultipleFilesPR(
        `Maj de la fiche de ${username} par ${session.id}`,
        files,
        `edit-authors-${username}`
    );

    await db("pull_requests").insert({
        username,
        url: prInfo.html_url,
        info: JSON.stringify({
            ...postParams,
        }),
    });

    let secondary_email, primary_email;
    const hasPublicServiceEmail = await isPublicServiceEmail(email);
    const isEmailBetaAsked = !hasPublicServiceEmail; //req.body.isEmailBetaAsked === 'true' || false;
    if (isEmailBetaAsked) {
        // primaryEmail sera l'email beta qui sera créé en asynchrone
        secondary_email = email;
    } else {
        primary_email = email;
    }

    await db("users")
        .insert({
            username,
            primary_email,
            tjm,
            gender,
            workplace_insee_code,
            legal_status,
            secondary_email,
            primary_email_status: isEmailBetaAsked
                ? EmailStatusCode.EMAIL_UNSET
                : EmailStatusCode.EMAIL_ACTIVE,
            primary_email_status_updated_at: new Date(),
            should_create_marrainage: false,
            osm_city,
            average_nb_of_days,
        })
        .onConflict("username")
        .merge();

    const hash = computeHash(username);
    await db("user_details")
        .insert({
            tjm,
            gender,
            hash,
            average_nb_of_days,
        })
        .onConflict("hash")
        .merge();

    await db("pull_requests").insert({
        username,
        url: prInfo.html_url,
        info: JSON.stringify({
            ...postParams,
        }),
    });
    return Response.json({
        message: `Success`,
        pr_url: prInfo.html_url,
    });
}

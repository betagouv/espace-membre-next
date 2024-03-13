"use server";
import { cookies } from "next/headers";

import { createMemberSchema } from "@/models/member";
import config from "@/server/config";
import {
    makeGithubAuthorFile,
    updateMultipleFilesPR,
} from "@/server/controllers/helpers/githubHelpers";
import db from "@/server/db";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import { createUsername } from "@/utils/github";

export async function createMember(
    data
): Promise<{ message: string; pr_url: string }> {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    const referent = session.id;
    const { firstname, lastname, email, mission, ...postParams } =
        createMemberSchema.parse(data);
    const username = createUsername(firstname, lastname);
    const files = [
        makeGithubAuthorFile(
            username,
            {
                ...postParams,
                fullname: `${firstname} ${lastname}`,
                role: "",
                missions: mission ? [mission] : [],
            },
            ""
        ),
    ];
    const prInfo = await updateMultipleFilesPR(
        `Création de la fiche de ${username} par ${session?.id}`,
        files,
        `edit-authors-${username}`
    );

    await db("users")
        .insert({
            username,
            secondary_email: email,
        })
        .onConflict("username")
        .merge();

    await db("pull_requests").insert({
        username,
        url: prInfo.html_url,
        info: JSON.stringify({
            startup: mission?.startups ? mission.startups[0] : undefined,
            username,
            referent,
        }),
    });

    return {
        message: "success",
        pr_url: prInfo.html_url,
    };
}

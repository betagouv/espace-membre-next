import { GithubAPIPullRequest } from "@/lib/github";
import {
    dbMemberSchemaType,
    memberSchemaType,
    memberStatInfoSchemaType,
} from "@/models/member";
import {
    makeGithubAuthorFile,
    updateMultipleFilesPR,
} from "@/server/controllers/helpers/githubHelpers";
import { computeHash } from "@/server/controllers/utils";
import db from "@/server/db";

export const createOrUpdateMemberData = async (
    action: {
        author: string;
        method: "create" | "update";
        username: string;
    },
    githubData: memberSchemaType,
    dbData: dbMemberSchemaType,
    privateData?: memberStatInfoSchemaType
): Promise<GithubAPIPullRequest> => {
    const { bio, ...authorFileData } = githubData;
    const files = [
        makeGithubAuthorFile(action.username, authorFileData, bio || ""),
    ];
    const prInfo = await updateMultipleFilesPR(
        action.method === "create"
            ? `Création de la fiche de ${action.username} par ${action.author}`
            : `Mise à jour de la fiche de ${action.username} par ${action.author}`,
        files,
        `edit-authors-${action.username}`
    );

    await db("users").insert(dbData).onConflict("username").merge();

    if (privateData) {
        const hash = computeHash(action.username);
        await db("user_details")
            .insert({
                ...privateData,
                hash,
            })
            .onConflict("hash")
            .merge();
    }

    let dbPrInfo = JSON.stringify(dbData);
    if (action.method === "create") {
        dbPrInfo = JSON.stringify({
            startup:
                githubData.missions.length && githubData.missions[0].startups
                    ? githubData.missions[0].startups[0]
                    : undefined,
            username: action.author,
            referent: action.author,
        });
    }

    await db("pull_requests").insert({
        username: action.username,
        url: prInfo.html_url,
        info: prInfo,
    });

    return prInfo;
};
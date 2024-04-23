import { GithubAPIPullRequest } from "@/lib/github";
import { DBUser } from "@/models/dbUser";
import {
    dbMemberSchemaType,
    memberSchemaType,
    memberStatInfoSchemaType,
} from "@/models/member";
import { PULL_REQUEST_STATE, PULL_REQUEST_TYPE } from "@/models/pullRequests";
import {
    makeGithubAuthorFile,
    updateMultipleFilesPR,
} from "@/server/controllers/helpers/githubHelpers";
import db from "@/server/db";
import { computeHash } from "@/utils/member";

export const createOrUpdateMemberData = async (
    action: {
        author: string;
        method: "create" | "update";
        username: string;
    },
    githubData: memberSchemaType,
    dbData: dbMemberSchemaType,
    privateData?: memberStatInfoSchemaType
): Promise<DBUser> => {
    // const { bio, ...authorFileData } = githubData;
    // const files = [
    //     makeGithubAuthorFile(action.username, authorFileData, bio || ""),
    // ];
    // const prInfo = await updateMultipleFilesPR(
    //     action.method === "create"
    //         ? `Création de la fiche de ${action.username} par ${action.author}`
    //         : `Mise à jour de la fiche de ${action.username} par ${action.author}`,
    //     files,
    //     `edit-authors-${action.username}`
    // );

    const [dbUser]: DBUser[] = await db("users")
        .insert({
            ...githubData,
            ...dbData,
        })
        .onConflict("username")
        .merge()
        .returning("*");

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
            name: githubData.fullname,
            referent: action.author,
        });
    }

    // await db("pull_requests").insert({
    //     username: action.username,
    //     type:
    //         action.method === "create"
    //             ? PULL_REQUEST_TYPE.PR_TYPE_ONBOARDING
    //             : PULL_REQUEST_TYPE.PR_TYPE_MEMBER_UPDATE,
    //     status:
    //         action.method === "create"
    //             ? PULL_REQUEST_STATE.PR_CREATED
    //             : PULL_REQUEST_STATE.PR_MEMBER_UPDATE_CREATED,
    //     url: prInfo.html_url,
    //     info: dbPrInfo,
    // });
    return dbUser;
    // return prInfo;
};

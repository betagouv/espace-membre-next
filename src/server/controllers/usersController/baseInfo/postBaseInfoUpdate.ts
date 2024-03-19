import { Request, Response } from "express";
import { z } from "zod";

import { addEvent, EventCode } from "@/lib/events";
import { memberSchema } from "@/models/member";
import { PULL_REQUEST_TYPE, PULL_REQUEST_STATE } from "@/models/pullRequests";
import betagouv from "@betagouv";
import {
    makeGithubAuthorFile,
    updateMultipleFilesPR,
} from "@controllers/helpers/githubHelpers";
import { GithubBetagouvFile } from "@controllers/helpers/githubHelpers/githubEntryInterface";
import db from "@db";

interface BaseInfoUpdateRequest extends Request {
    body: z.infer<typeof memberSchema>;
}

export async function postBaseInfoUpdate(
    req: BaseInfoUpdateRequest,
    res: Response
) {
    const { username } = req.params;
    try {
        const info = await betagouv.userInfosById(username);

        const { bio, ...postParams } = req.body;
        const files: GithubBetagouvFile[] = [
            makeGithubAuthorFile(username, postParams, bio || ""),
        ];

        // todo: check if no existing PR
        // todo: assign users
        // todo: set labels
        const prInfo = await updateMultipleFilesPR(
            `Maj de la fiche de ${username} par ${req.auth?.id}`,
            files,
            `edit-authors-${username}`
        );

        addEvent(EventCode.MEMBER_BASE_INFO_UPDATED, {
            created_by_username: req.auth?.id as string,
            action_on_username: username,
            action_metadata: {
                value: req.body,
                old_value: info,
            },
        });

        await db("pull_requests").insert({
            url: prInfo.html_url,
            //  sha: prInfo.head.sha,
            username,
            type: PULL_REQUEST_TYPE.PR_TYPE_MEMBER_UPDATE,
            status: PULL_REQUEST_STATE.PR_MEMBER_UPDATE_CREATED,
            info: JSON.stringify(postParams),
        });

        const message = `Pull request ouverte pour la la fiche de ${username}. 
        \nDemande à un membre de ton équipe de merger ta fiche : <a href="${prInfo.html_url}" target="_blank">${prInfo.html_url}</a>. 
        \nUne fois mergée, ton profil sera mis à jour.`;
        res.json({
            message,
            username: username,
            pr_url: prInfo.html_url,
        });
    } catch (err) {
        let message;
        if (err instanceof Error) {
            message = {
                message: err.message,
                errors: err.cause,
            };
        }
        res.status(400).json(message);
    }
}

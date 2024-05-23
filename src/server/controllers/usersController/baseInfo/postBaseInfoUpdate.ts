import { Request, Response } from "express";
import { z } from "zod";

import { addEvent } from "@/lib/events";
import { EventCode } from "@/models/actionEvent";
import { DBUser } from "@/models/dbUser";
import { memberSchema } from "@/models/member";
import { DBMission, createDBMission } from "@/models/mission";
import { PULL_REQUEST_TYPE, PULL_REQUEST_STATE } from "@/models/pullRequests";
import { deleteMission } from "@/server/db/dbMission";
import {
    createOrUpdateDBUser,
    getDBUser,
    getDBUserAndMission,
} from "@/server/db/dbUser";
import betagouv from "@betagouv";
import {
    makeGithubAuthorFile,
    updateMultipleFilesPR,
} from "@controllers/helpers/githubHelpers";
import { GithubBetagouvFile } from "@controllers/helpers/githubHelpers/githubEntryInterface";
import db from "@db";

export const updateMemberSchema = memberSchema.pick({
    fullname: true,
    role: true,
    link: true,
    avatar: true,
    github: true,
    competences: true,
    teams: true,
    missions: true,
    startups: true,
    previously: true,
    domaine: true,
    bio: true,
    memberType: true,
    gender: true,
    average_nb_of_days: true,
    tjm: true,
    legal_status: true,
    workplace_insee_code: true,
    osm_city: true,
});

export type updateMemberSchemaType = z.infer<typeof updateMemberSchema>;

interface BaseInfoUpdateRequest extends Request {
    body: updateMemberSchemaType;
}

export async function postBaseInfoUpdate(
    req: BaseInfoUpdateRequest,
    res: Response
) {
    const { username } = req.params;
    try {
        const previousInfo = await getDBUserAndMission(username);
        if (!previousInfo) {
            throw new Error("User does not exists");
        }
        // const { bio, ...postParams } = req.body;
        // const files: GithubBetagouvFile[] = [
        //     makeGithubAuthorFile(username, postParams, bio || ""),
        // ];

        // // todo: check if no existing PR
        // // todo: assign users
        // // todo: set labels
        // const prInfo = await updateMultipleFilesPR(
        //     `Maj de la fiche de ${username} par ${req.auth?.id}`,
        //     files,
        //     `edit-authors-${username}`
        // );
        // Any remaining IDs in existingMissionIds should be deleted
        try {
            await db.transaction(async (trx) => {
                const actualMissions = req.body.missions
                    .filter((m) => m.uuid)
                    .map((m) => m.uuid);
                console.log(actualMissions);
                const missionsToDelete = previousInfo.missions.filter(
                    (m) => !actualMissions.includes(m.uuid)
                );
                console.log(missionsToDelete);
                for (let mission of missionsToDelete) {
                    await deleteMission(mission.uuid, trx);
                }
                console.log(req.body.missions);
                await createOrUpdateDBUser(
                    {
                        ...previousInfo,
                        ...req.body,
                        username,
                        // @ts-ignore todo
                        missions: req.body.missions.map((m) => ({
                            ...m,
                            user_id: previousInfo.uuid,
                            username: previousInfo.username,
                            startups: m.startups || [],
                            end: m.end,
                        })),
                    },
                    trx
                );
            });
        } catch (error) {
            console.error("Transaction failed:", error);
        }

        // const [dbUser]: DBUser[] = await db("users")
        //     .update({
        //         ...req.body,
        //     })
        //     .where({ username })
        //     .returning("*");

        addEvent({
            action_code: EventCode.MEMBER_BASE_INFO_UPDATED,
            created_by_username: req.auth?.id as string,
            action_on_username: username,
            action_metadata: {
                value: req.body,
                // old_value: previousInfo, todo
            },
        });

        // await db("pull_requests").insert({
        //     url: prInfo.html_url,
        //     //  sha: prInfo.head.sha,
        //     username,
        //     type: PULL_REQUEST_TYPE.PR_TYPE_MEMBER_UPDATE,
        //     status: PULL_REQUEST_STATE.PR_MEMBER_UPDATE_CREATED,
        //     info: JSON.stringify(postParams),
        // });

        // const message = `Pull request ouverte pour la la fiche de ${username}.
        // \nDemande à un membre de ton équipe de merger ta fiche : <a href="${prInfo.html_url}" target="_blank">${prInfo.html_url}</a>.
        // \nUne fois mergée, ton profil sera mis à jour.`;
        const dbUser = await getDBUserAndMission(username);
        res.json(dbUser);
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

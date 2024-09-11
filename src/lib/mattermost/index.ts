import * as Sentry from "@sentry/node";
import axios from "axios";
import { z } from "zod";

import config from "@/server/config";
import { getMattermostConfig } from "@/server/config/mattermost/mattermost.config";

export const MattermostUserSchema = z.object({
    id: z.string(),
    create_at: z.number(),
    update_at: z.number(),
    delete_at: z.number(),
    username: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    nickname: z.string(),
    email: z.string(),
    email_verified: z.boolean(),
    auth_service: z.string(),
    roles: z.string(),
    locale: z.string(),
    mfa_active: z.boolean(),
    last_activity_at: z.string(),
});

export const getMattermostUserInfo = async (
    email: string | null
): Promise<{
    mattermostUser: MattermostUser | null;
    mattermostUserInTeamAndActive: boolean;
}> => {
    if (!email) {
        return {
            mattermostUser: null,
            mattermostUserInTeamAndActive: false,
        };
    }
    try {
        let mattermostUser = email
            ? await getUserByEmail(email).catch((e) => null)
            : null;
        const [mattermostUserInTeamAndActive] = email
            ? await searchUsers({
                  term: email,
                  team_id: config.mattermostTeamId,
                  allow_inactive: false,
              }).catch((e) => [])
            : [];
        return {
            mattermostUser,
            mattermostUserInTeamAndActive,
        };
    } catch (e) {
        Sentry.captureException(e);
        return {
            mattermostUser: null,
            mattermostUserInTeamAndActive: false,
        };
    }
};

export type MattermostUser = z.infer<typeof MattermostUserSchema>;

export interface MattermostChannel {
    name: string;
    display_name: string;
    purpose: string;
    header: string;
    last_post_at: string;
    total_msg_count: string;
}

export async function getUserWithParams(
    params = {},
    i = 0
): Promise<MattermostUser[]> {
    const mattermostUsers = await axios
        .get(`${config.mattermostURL}/api/v4/users?per_page=200&page=${i}`, {
            params: {
                ...params,
            },
            ...getMattermostConfig(),
        })
        .then((response) => response.data);
    if (!mattermostUsers.length) {
        return [];
    }
    const nextPageMattermostUsers = await getUserWithParams(params, i + 1);
    return [...mattermostUsers, ...nextPageMattermostUsers];
}

export async function searchUsers(params = {}) {
    return await axios
        .post(
            `${config.mattermostURL}/api/v4/users/search`,
            params,
            getMattermostConfig()
        )
        .then((response) => response.data);
}

export async function getUserByEmail(email: string): Promise<MattermostUser> {
    return await axios
        .get(`${config.mattermostURL}/api/v4/users/email/${email}`, {
            ...getMattermostConfig(),
        })
        .then((response) => response.data);
}

export async function addUserToTeam(userId, teamId) {
    let res;
    try {
        res = await axios
            .post(
                `${config.mattermostURL}/api/v4/teams/${teamId}/members`,
                {
                    team_id: teamId,
                    user_id: userId,
                },
                getMattermostConfig()
            )
            .then((response) => response.data);
    } catch (err) {
        console.error(err);
        throw new Error(
            `Erreur d'ajout de l'utilisateur ${userId} à la team ${teamId} : ${err}`
        );
    }
    console.log(`Ajout de utilisateur ${userId} à la team ${teamId}`);
    return res;
}

export async function removeUserFromTeam(userId, teamId) {
    let res;
    try {
        res = await axios
            .delete(
                `${config.mattermostURL}/api/v4/teams/${teamId}/members/${userId}`,
                {
                    ...getMattermostConfig(),
                }
            )
            .then((response) => response.data);
    } catch (err) {
        console.error(err);
        throw new Error(
            `Erreur de suppression de l'utilisateur ${userId} de la team ${teamId} : ${err}`
        );
    }
    console.log(`Suppression de utilisateur ${userId} de la team ${teamId}`);
    return res;
}

export async function inviteUsersToTeamByEmail(userEmails, teamId) {
    let res;
    try {
        res = await axios
            .post(
                `${config.mattermostURL}/api/v4/teams/${teamId}/invite/email`,
                userEmails,
                getMattermostConfig()
            )
            .then((response) => response.data);
    } catch (err) {
        console.error(
            "Erreur d'ajout des utilisateurs à mattermost",
            err,
            userEmails
        );
        return null;
    }
    console.log("Ajout des utilisateurs à mattermost", userEmails);
    return res;
}

export async function getInactiveMattermostUsers(params = {}, i = 0) {
    const mattermostUsers = await axios
        .get(`${config.mattermostURL}/api/v4/users`, {
            params: {
                ...params,
                per_page: 200,
                page: i,
                inactive: true,
            },
            ...getMattermostConfig(),
        })
        .then((response) => response.data);
    if (!mattermostUsers.length) {
        return [];
    }
    const nextPageMattermostUsers = await getInactiveMattermostUsers(
        params,
        i + 1
    );
    return [...mattermostUsers, ...nextPageMattermostUsers];
}

export async function changeUserEmail(id: string, email: string) {
    try {
        const res: MattermostUser = await axios
            .put(
                `${config.mattermostURL}/api/v4/users/${id}/patch`,
                {
                    email,
                },
                getMattermostConfig()
            )
            .then((response) => response.data);
        console.log(`Changement de l'email de l'utilisateur ${res.username}`);
        return true;
    } catch (err) {
        console.error(
            `Erreur de changement d'email de l'utilisateur mattermost : ${id}`,
            err
        );
        return false;
    }
}

export const createUser = async function createUser(
    { email, username, password, position },
    inviteId
) {
    if (!inviteId) {
        const errorMessage =
            "Unable to launch createUser without env var MATTERMOST_INVITE_ID";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
    let res;
    try {
        res = await axios
            .post(
                `${config.mattermostURL}/api/v4/users?iid=${inviteId}`,
                {
                    email,
                    username,
                    password,
                    position,
                },
                getMattermostConfig()
            )
            .then((response) => response.data);
    } catch (err) {
        throw new Error(
            `Erreur d'ajout de l'utilisateurs ${username} à mattermost : ${err}`
        );
    }
    console.log("Ajout de l'utilisateur", email, username);
    return res;
};

export * from "./getActiveMattermostUsers";
export * from "./getMattermostUsersStatus";
export * from "./getAllChannels";
export * from "./getTeam";
export * from "./deactiveUsers";
export * from "./activeUsers";

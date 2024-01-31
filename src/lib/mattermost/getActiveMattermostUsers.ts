import axios from "axios";
import config from "@/server/config";
import { getMattermostConfig } from "@/server/config/mattermost/mattermost.config";

interface ParamsType {
    in_team?: string;
}

export async function getActiveMattermostUsers(
    params: ParamsType = {},
    i: number = 0
) {
    const mattermostUsers = await axios
        .get(
            `${config.mattermostURL}/api/v4/users?per_page=200&page=${i}&active=true&in_team=${params.in_team}`,
            {
                ...getMattermostConfig(),
            }
        )
        .then((response) => response.data);
    if (!mattermostUsers.length) {
        return [];
    }
    const nextPageMattermostUsers = await getActiveMattermostUsers(
        params,
        i + 1
    );
    return [...mattermostUsers, ...nextPageMattermostUsers];
}

import config from "@/config";
import { getMattermostConfig } from "@/config/mattermost/mattermost.config";
import axios from "axios";

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
  
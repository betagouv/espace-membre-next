import axios from "axios";

import config from "@/server/config";
import { getMattermostConfig } from "@/server/config/mattermost/mattermost.config";

export async function activeUsers(userId) {
  try {
    const payload = { active: true };
    const response = await axios.put(
      `${config.mattermostURL}/api/v4/users/${userId}/active`,
      payload,
      getMattermostConfig(),
    );
    console.log(`Le compte mattermost ${userId} a été activé`);
    return response.data;
  } catch (err) {
    console.error("Erreur d'activation de l‘utilisateurs à mattermost", err);
  }
}

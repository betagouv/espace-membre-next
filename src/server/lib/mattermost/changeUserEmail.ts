import config from "@config";
import { getMattermostConfig } from "@config/mattermost/mattermost.config";
import axios from "axios";
import { MattermostUser } from ".";

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

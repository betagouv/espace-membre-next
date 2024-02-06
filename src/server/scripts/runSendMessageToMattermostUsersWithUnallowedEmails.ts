import { sendMessageToMattermostUsersWithUnallowedEmails } from "@schedulers/mattermostScheduler/mattermostScheduler";
import config from "@/server/config";

sendMessageToMattermostUsersWithUnallowedEmails(config.mattermostTeamId).then(
    () => {
        console.log("Done");
    }
);

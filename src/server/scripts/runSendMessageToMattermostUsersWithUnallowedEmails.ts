import config from "@/server/config";
import { sendMessageToMattermostUsersWithUnallowedEmails } from "@schedulers/mattermostScheduler/mattermostScheduler";

sendMessageToMattermostUsersWithUnallowedEmails(config.mattermostTeamId).then(
  () => {
    console.log("Done");
  },
);

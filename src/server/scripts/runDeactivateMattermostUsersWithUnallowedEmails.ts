import config from "@/server/config";
import { deactivateMattermostUsersWithUnallowedEmails } from "@schedulers/mattermostScheduler/mattermostScheduler";

deactivateMattermostUsersWithUnallowedEmails(config.mattermostTeamId).then(
  () => {
    console.log("Done");
  },
);

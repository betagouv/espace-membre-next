import { sendEmailToIncubatorTeam } from "../queueing/workers/send-email-to-incubator";
import { sendEmailToTeamsToCheckOnTeamComposition } from "@/server/queueing/workers/send-email-to-teams-to-check-on-team-composition";
// sendEmailToTeamsToCheckOnTeamComposition({
//     id: "",
//     name: "",
//     data: undefined,
// });
sendEmailToIncubatorTeam({
    id: "",
    name: "",
    data: undefined,
});

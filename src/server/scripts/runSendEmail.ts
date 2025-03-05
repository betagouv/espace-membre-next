import { sendEmailToIncubatorTeam } from "../queueing/workers/send-email-to-incubator";
import { sendEmailToTeamsToCheckOnTeamComposition } from "@/server/queueing/workers/send-email-to-teams-to-check-on-team-composition";

if (process.argv[2] === "sendTeamCompositionEmail") {
    sendEmailToTeamsToCheckOnTeamComposition({
        id: "",
        name: "",
        data: undefined,
    });
}
if (process.argv[2] === "sendIncubatorTeamEmail") {
    sendEmailToIncubatorTeam({
        id: "",
        name: "",
        data: undefined,
    });
}

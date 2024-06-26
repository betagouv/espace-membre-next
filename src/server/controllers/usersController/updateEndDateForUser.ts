import { updateAuthorGithubFile } from "../helpers/githubHelpers";
import { GithubAuthorMissionChange } from "../helpers/githubHelpers/githubEntryInterface";
import { addEvent } from "@/lib/events";
import { EventCode } from "@/models/actionEvent";
import { GithubMission } from "@/models/mission";
import config from "@/server/config";
import { requiredError, isValidDate } from "@/server/controllers/validator";
import betagouv from "@betagouv";

export async function updateEndDateForUser(req, res) {
    const { username } = req.params;

    try {
        const formValidationErrors = {};
        const errorHandler = (field, message) => {
            const errorMessagesForKey: string[] = [];
            // get previous message
            if (formValidationErrors[field]) {
                errorMessagesForKey.push(formValidationErrors[field]);
            }
            // add new message to array
            errorMessagesForKey.push(message);
            // make it one message
            formValidationErrors[field] = errorMessagesForKey.join(",");
        };

        const { start, end } = req.body;
        const newEnd =
            req.body.newEnd ||
            requiredError("nouvelle date de fin", errorHandler);

        const startDate = new Date(start);
        const newEndDate = isValidDate(
            "nouvelle date de fin",
            new Date(newEnd),
            errorHandler
        );

        if (startDate && newEndDate) {
            if (newEndDate < startDate) {
                errorHandler(
                    "nouvelle date de fin",
                    "La date doit être supérieure à la date de début"
                );
            }
        }

        if (Object.keys(formValidationErrors).length) {
            req.flash("error", formValidationErrors);
            throw new Error();
        }
        const info = await betagouv.userInfosById(username);
        const missions =
            info?.missions.map((mission) => ({
                ...mission,
                end: mission.end ? new Date(mission.end) : undefined,
                start: mission.start ? new Date(mission.start) : undefined,
            })) || [];
        if (missions?.length) {
            missions[missions.length - 1].end = newEndDate;
        }
        const changes: GithubAuthorMissionChange = {
            missions: missions as GithubMission[],
        };
        await updateAuthorGithubFile(username, changes);
        addEvent({
            action_code: EventCode.MEMBER_END_DATE_UPDATED,
            created_by_username: req.auth.id,
            action_on_username: username,
            action_metadata: {
                value: newEnd,
                old_value: end,
            },
        });
        // TODO: get actual PR url instead
        const pullRequestsUrl = `https://github.com/${config.githubRepository}/pulls`;
        req.flash(
            "message",
            `⚠️ Pull request pour la mise à jour de la fiche de ${username} ouverte. 
        \nDemande à un membre de ton équipe de merger ta fiche : <a href="${pullRequestsUrl}" target="_blank">${pullRequestsUrl}</a>. 
        \nUne fois mergée, ton profil sera mis à jour.`
        );
        res.redirect(`/community/${username}`);
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            req.flash("error", err.message);
        }
        res.redirect(`/community/${username}`);
    }
}

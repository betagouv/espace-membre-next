import { updateMultipleFilesPR } from "@controllers/helpers/githubHelpers/updateGithubCollectionEntry";
import db from "@db";
import slugify from "@sindresorhus/slugify";

import {
    makeGithubSponsorFile,
    makeGithubStartupFile,
    makeImageFile,
} from "../helpers/githubHelpers";
import {
    GithubBetagouvFile,
    GithubStartupChange,
} from "../helpers/githubHelpers/githubEntryInterface";

import { addEvent } from "@/lib/events";
import { EventCode } from "@/models/actionEvent";
import { PULL_REQUEST_TYPE, PULL_REQUEST_STATE } from "@/models/pullRequests";
import {
    Sponsor,
    SponsorDomaineMinisteriel,
    SponsorType,
} from "@/models/sponsor";
import { StartupPhase } from "@/models/startup";
import { isValidDate, requiredError } from "@/server/controllers/validator";

const isValidPhase = (field, value, callback) => {
    if (!value || Object.values(StartupPhase).includes(value)) {
        return;
    }
    callback(field, `La phase n'as pas une valeur valide`);
    return;
};

export async function postStartupInfoUpdate(req, res) {
    // TODO: use Zod
    try {
        const formValidationErrors = {};
        const errorHandler = (field, message) => {
            const errorMessagesForKey = formValidationErrors[field] || [];
            // add new message to array
            errorMessagesForKey.push(message);
            // make it one message
            formValidationErrors[field] = errorMessagesForKey;
        };

        const phases = req.body.phases;
        phases.forEach((phase) => {
            isValidPhase("phase", phase.name, errorHandler);
            isValidDate("date", new Date(phase.start), errorHandler);
            !phase.end ||
                isValidDate("date", new Date(phase.end), errorHandler);
        });
        let startupId = req.params.startup;
        let title =
            req.body.title || requiredError("nom du produit", errorHandler);
        if (!startupId) {
            startupId = slugify(req.body.title);
        }
        const link = req.body.link;
        const dashlord_url = req.body.dashlord_url;
        const mission =
            req.body.mission || requiredError("mission", errorHandler);
        const stats_url = req.body.stats_url;
        const budget_url = req.body.budget_url;
        const repository = req.body.repository;
        const thematiques = req.body.thematiques;
        const usertypes = req.body.usertypes;
        const incubator = req.body.incubator;
        const sponsors = req.body.sponsors || [];
        const contact = req.body.contact;
        const accessibility_status = req.body.accessibility_status;
        const analyse_risques_url = req.body.analyse_risques_url;
        const analyse_risques =
            req.body.analyse_risques === "true" ||
            req.body.analyse_risques === true
                ? true
                : false;
        const mon_service_securise =
            req.body.mon_service_securise === "true" ||
            req.body.mon_service_securise === true
                ? true
                : false;
        const newSponsors: Sponsor[] = req.body.newSponsors || [];
        const image: string = req.body.image;

        if (newSponsors) {
            newSponsors.forEach((sponsor: Sponsor) => {
                Object.values(SponsorDomaineMinisteriel).includes(
                    sponsor.domaine_ministeriel
                ) || errorHandler("domaine", "le domaine n'est pas valide");
                Object.values(SponsorType).includes(sponsor.type) ||
                    errorHandler("type", "le type n'est pas valide");
            });
        }

        const content =
            req.body.markdown ||
            requiredError("description du produit", errorHandler);
        phases[0] || requiredError("phases", errorHandler);

        if (Object.keys(formValidationErrors).length) {
            console.error(formValidationErrors);
            throw new Error("Erreur dans le formulaire", {
                cause: formValidationErrors,
            });
        }
        let changes: GithubStartupChange = {
            link,
            dashlord_url,
            mission,
            stats_url,
            budget_url,
            repository,
            incubator,
            title,
            contact,
            accessibility_status,
            analyse_risques_url,
            analyse_risques,
            mon_service_securise,
            thematiques,
            usertypes,
            sponsors: sponsors.map((sponsor) => `/organisations/${sponsor}`),
        };
        const newPhases = phases.map((phase) => ({
            ...phase,
            end: phase.end ? new Date(phase.end) : undefined,
            start: phase.start ? new Date(phase.start) : undefined,
        }));
        changes["phases"] = newPhases;
        const files: GithubBetagouvFile[] = [
            makeGithubStartupFile(startupId, changes, content),
            ...newSponsors.map((sponsor) =>
                makeGithubSponsorFile(sponsor.acronym, sponsor)
            ),
        ];
        if (image) {
            console.log("Added image file");
            const imageFile = makeImageFile(startupId, image);
            files.push(imageFile);
        }
        const prInfo = await updateMultipleFilesPR(
            `Maj de la fiche ${startupId} par ${req.auth.id}`,
            files,
            `edit-startup-${startupId}`
        );

        addEvent({
            action_code: EventCode.STARTUP_INFO_UPDATED,
            created_by_username: req.auth.id,
            action_metadata: {
                value: {
                    ...changes,
                },
            },
        });
        await db("pull_requests").insert({
            url: prInfo.html_url,
            startup: startupId,
            type: PULL_REQUEST_TYPE.PR_TYPE_STARTUP_UPDATE,
            status: PULL_REQUEST_STATE.PR_STARTUP_UPDATE_CREATED,
            info: JSON.stringify(changes),
        });
        const message = `⚠️ Pull request pour la mise à jour de la fiche de ${startupId} ouverte. 
        \nUn membre de l'equipe doit merger la fiche : <a href="${prInfo.html_url}" target="_blank">${prInfo.html_url}</a>. 
        \nUne fois mergée, la fiche sera mis à jour dans les 10 minutes.`;
        req.flash("message", message);
        res.json({
            message,
            pr_url: prInfo.html_url,
        });
    } catch (err) {
        console.error(err);
        let message;
        if (err instanceof Error) {
            message = {
                message: err.message,
                errors: err.cause,
            };
        }
        res.status(400).json(message);
    }
}

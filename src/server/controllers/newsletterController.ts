import config from "@/server/config";
import knex from "../db";
import { formatDateToFrenchTextReadableFormat, getMonday } from "@/utils/date";
import { format } from "date-fns/format";
import { add } from "date-fns/add";
import { fr } from "date-fns/locale/fr";

const errorMessage = "Impossible de récupérer les infolettres.";

const formatNewsletterPageData = (req, newsletters, currentNewsletter) => ({
    errors: req.flash("error"),
    messages: req.flash("message"),
    userConfig: config.user,
    domain: config.domain,
    currentUserId: req.auth.id,
    currentNewsletter,
    newsletters,
    isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
    activeTab: "newsletter",
});

const updateCurrentNewsletterValidator = async (validator) => {
    let lastNewsletter = await knex("newsletters")
        .orderBy("created_at", "desc")
        .first();
    if (lastNewsletter && !lastNewsletter.sent_at) {
        lastNewsletter = await knex("newsletters")
            .where({
                id: lastNewsletter.id,
            })
            .update({
                validator,
            })
            .returning("*");
    }
    return lastNewsletter;
};

const formatNewsletter = (newsletter) => ({
    ...newsletter,
    title: newsletter.sent_at
        ? format(newsletter.sent_at, "d MMMM yyyy", { locale: fr })
        : format(
              add(getMonday(newsletter.created_at), { weeks: 1 }),
              "d MMMM yyyy",
              { locale: fr }
          ), // get next monday (date + 7 days),
    sent_at: newsletter.sent_at
        ? format(newsletter.sent_at, "dd/MM/yyyy à HH:mm")
        : undefined,
});

// export async function getNewsletterPage(req, res) {
//     getNewsletter(
//         req,
//         res,
//         (data) => {
//             res.render("newsletter", {
//                 ...data,
//             });
//         },
//         (data) => {
//             res.render("newsletter", {
//                 ...data,
//             });
//         }
//     );
// }

export async function getNewsletterApi(req, res) {
    getNewsletter(
        req,
        res,
        (data) => {
            res.json({
                ...data,
            });
        },
        (data) => {
            res.status(500).json({
                message: req.flash("error"),
            });
        }
    );
}

export async function getNewsletter(req, res, onSuccess, onError) {
    try {
        let newsletters = await knex("newsletters")
            .select()
            .orderBy("created_at", "desc");
        newsletters = newsletters.map((newsletter) =>
            formatNewsletter(newsletter)
        );
        const currentNewsletter = newsletters.shift();
        onSuccess(
            formatNewsletterPageData(req, newsletters, currentNewsletter)
        );
    } catch (err) {
        console.error(err);
        req.flash("error", errorMessage);
        onError(formatNewsletterPageData(req, [], null));
    }
}

export async function validateNewsletter(req, res) {
    try {
        const currentNewsletter = await updateCurrentNewsletterValidator(
            req.auth.id
        );
        if (!currentNewsletter) {
            throw new Error("Il n'y a pas d'infolettre pour cette semaine");
        }

        req.flash(
            "message",
            "L'infolettre a été validée et sera envoyée ce soir."
        );
        res.redirect("/newsletters");
    } catch (err) {
        console.error(err);
        req.flash("error", errorMessage);
        res.redirect("/newsletters");
    }
}

export async function cancelNewsletter(req, res) {
    try {
        const currentNewsletter = await updateCurrentNewsletterValidator(null);
        if (!currentNewsletter) {
            throw new Error("Il n'y a pas d'infolettre pour cette semaine");
        }

        req.flash(
            "message",
            "L'envoie automatique de l'infolettre a été annulé."
        );
        res.redirect("/newsletters");
    } catch (err) {
        console.error(err);
        req.flash("error", errorMessage);
        res.redirect("/newsletters");
    }
}

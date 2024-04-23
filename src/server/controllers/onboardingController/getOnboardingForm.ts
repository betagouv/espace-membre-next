import * as Sentry from "@sentry/node";

import { genderOptions, statusOptions } from "@/models/dbUser/dbUser";
import { DOMAINE_OPTIONS, Member } from "@/models/member";
import config from "@/server/config";
import { getActiveUsers, getAllUsersPublicInfo } from "@/server/db/dbUser";
import BetaGouv from "@betagouv";

export async function getFormApi(req, res) {
    getOnboardingPageData(
        req,
        res,
        (data) => {
            res.json({
                ...data,
            });
        },
        (err) => {
            Sentry.captureException(err);
            res.status(500).json({
                error: "Impossible de récupérer vos informations.",
            });
        }
    );
}

export async function getOnboardingPageData(req, res, onSuccess, onError) {
    try {
        const title = "Mon compte";
        const formValidationErrors = {};
        const startups = await BetaGouv.startupsInfos();
        const users = await getActiveUsers();
        const allUsers = await getAllUsersPublicInfo();
        const startupOptions = startups.map((startup) => {
            return {
                value: startup.id,
                label: startup.attributes.name,
            };
        });
        onSuccess({
            title,
            formValidationErrors,
            startups,
            genderOptions,
            statusOptions,
            startupOptions,
            domaineOptions: DOMAINE_OPTIONS,
            userConfig: config.user,
            users,
            allUsers,
            formData: {
                gender: "",
                legal_status: "",
                workplace_insee_code: "",
                tjm: 0,
                secondary_email: "",
                osm_city: "",
                average_nb_of_days: 0,
                communication_email: "secondary",
                should_create_marrainage: false,
                memberType: "beta",
            },
            communeInfo: null,
        });
    } catch (err) {
        Sentry.captureException(err);
        onError(err);
    }
}

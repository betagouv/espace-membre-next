import config from "@/server/config";

export async function getStartupInfoCreateApi(req, res) {
    getStartupInfoCreatePageData(
        req,
        res,
        (data) => {
            res.json({
                ...data,
            });
        },
        (err) => {
            res.status(500).json({
                error: "Impossible de récupérer les information de la startup.",
            });
        }
    );
}

async function getStartupInfoCreatePageData(req, res, onSuccess, onError) {
    try {
        const title = "Changer une startup de phase";
        const formValidationErrors = {};
        onSuccess({
            title,
            formValidationErrors,
            currentUserId: req.auth.id,
            isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
            activeTab: "startups",
            subActiveTab: "create",
            username: req.auth.id,
            formData: {
                // link: '',
                // dashlord_url: '',
                // repository: '',
                // mission: ''
                // stats_url: '',
                // incubator:
                // sponsors: startup.attributes.sponsors
            },
        });
    } catch (err) {
        onError(err);
    }
}

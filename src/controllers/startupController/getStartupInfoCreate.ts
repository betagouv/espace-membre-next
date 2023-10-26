export async function getStartupInfoCreate() {
    try {
        const title = "Changer une startup de phase";
        const formValidationErrors = {};
        return {
            title,
            formValidationErrors,
            currentUserId: "",
            isAdmin: false, //onfig.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
            activeTab: "startups",
            subActiveTab: "create",
            username: "lucas",
            formData: {
                // link: '',
                // dashlord_url: '',
                // repository: '',
                // mission: ''
                // stats_url: '',
                // incubator:
                // sponsors: startup.attributes.sponsors
            },
            // errors: req.flash('error'),
            // messages: req.flash('message'),
            // request: req
        };
    } catch (err) {
        console.error(err);
        throw new Error(
            "Impossible de récupérer les information de la startup."
        );
    }
}

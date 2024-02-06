import config from "@/server/config";

export function getIndex(req, res) {
    if (!req.auth) {
        return res.redirect("/login");
    }

    return res.redirect(config.defaultLoggedInRedirectUrl);
}

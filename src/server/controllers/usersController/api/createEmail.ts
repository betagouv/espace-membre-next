import { createEmailForUser } from "../createEmailForUser";

export async function createEmailApi(req, res) {
    const username = req.sanitize(req.params.username);
    try {
        await createEmailForUser({ username }, req.auth.id);
        req.flash("message", "Le compte email a bien été créé.");
        res.json({
            status: "created",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            errors:
                err instanceof Error
                    ? err.message
                    : "Le compte email a bien été créé",
        });
    }
}

import db from "@/db";

export async function postSignIn(req, res) {
    if (!req.body.token) {
        // req.flash("error", `Ce lien de connexion n'est pas valide.`);
        // return res.redirect("/");
        throw new Error(`Ce lien de connexion n'est pas valide.`);
    }
    const token = decodeURIComponent(req.body.token);
    const tokenDbResponse = await db("login_tokens")
        .select()
        .where({ token })
        .andWhere("expires_at", ">", new Date());

    if (tokenDbResponse.length !== 1) {
        throw new Error(`Ce lien de connexion a expiré.`);

        // req.flash("error", "Ce lien de connexion a expiré.");
        // return res.redirect("/");
    }

    const dbToken = tokenDbResponse[0];
    if (dbToken.token !== token) {
        throw new Error(`Ce lien de connexion a expiré.`);
        // req.flash("error", "Ce lien de connexion a expiré.");
        // return res.redirect("/");
    }

    await db("login_tokens").where({ email: dbToken.email }).del();

    return {
        name: dbToken.username,
        email: dbToken.email,
    };
}

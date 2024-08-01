import express from "express";
import path from "path";

const setupStaticFiles = (app) => {
    app.use("/public", express.static(path.join(__dirname, ".../public")));
    app.use("/static", express.static(path.join(__dirname, "../../static")));
    app.use(
        "/datagouvfr",
        express.static(
            path.join(
                __dirname,
                process.env.NODE_ENV === "production" ? "../../.." : "../..",
                "node_modules/template.data.gouv.fr/dist"
            )
        )
    ); // hack to mimick the behavior of webpack css-loader (used to import template.data.gouv.fr)
};

export { setupStaticFiles };

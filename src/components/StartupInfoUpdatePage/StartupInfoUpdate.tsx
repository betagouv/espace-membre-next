"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import * as Sentry from "@sentry/nextjs";
import axios from "axios";

import { StartupForm } from "../StartupForm/StartupForm";

import { GithubAPIPullRequest } from "@/lib/github";
import { Incubator } from "@/models/incubator";
import { Sponsor } from "@/models/sponsor";
import { StartupFrontMatter } from "@/models/startup";
import routes, { computeRoute } from "@/routes/routes";
import { routeTitles } from "@/utils/routes/routeTitles";

export interface StartupInfoUpdateProps {
    formData: StartupFrontMatter & { markdown: string };
    incubators: Incubator[];
    sponsors: Sponsor[];
    updatePullRequest?: GithubAPIPullRequest;
}

/* Pure component */
export const StartupInfoUpdate = (props: StartupInfoUpdateProps) => {
    const css = ".panel { overflow: hidden; width: auto; min-height: 100vh; }";

    const save = async (data) => {
        try {
            const resp = await axios.post(
                computeRoute(routes.STARTUP_POST_INFO_UPDATE_FORM).replace(
                    ":startup",
                    props.formData.id
                ),
                {
                    ...data,
                },
                {
                    withCredentials: true,
                }
            );
            window.scrollTo({ top: 20, behavior: "smooth" });
            return {
                ...resp,
                isUpdate: true,
            };
        } catch (e) {
            Sentry.captureException(e);
            console.error(e);
            window.scrollTo({ top: 20, behavior: "smooth" });
            throw e;
        }
    };

    return (
        <>
            <div className={fr.cx("fr-mb-5w")}>
                <h1>{routeTitles.startupDetailsEdit(props.formData.title)}</h1>

                <div className="beta-banner"></div>

                {(props.formData && (
                    <StartupForm
                        save={save}
                        formData={props.formData}
                        incubators={props.incubators}
                        sponsors={props.sponsors}
                        updatePullRequest={props.updatePullRequest}
                    />
                )) || <>Loading...</>}
            </div>
            <style media="screen">{css}</style>
        </>
    );
};

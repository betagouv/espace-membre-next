"use client";
import React from "react";

import * as Sentry from "@sentry/nextjs";
import slugify from "@sindresorhus/slugify";
import axios from "axios";

import { StartupForm } from "../StartupForm/StartupForm";

import { GithubAPIPullRequest } from "@/lib/github";
import { Incubator } from "@/models/incubator";
import { Sponsor } from "@/models/sponsor";
import { StartupFrontMatter } from "@/models/startup";
import routes, { computeRoute } from "@/routes/routes";

export interface StartupInfoCreateProps {
    formData: StartupFrontMatter & { markdown: string };
    incubators: Incubator[];
    sponsors: Sponsor[];
    updatePullRequest?: GithubAPIPullRequest;
}

const NEW_PRODUCT_DATA = {
    startup: "new-product",
    title: "",
    mission: "",
    markdown: "",
    contact: "",
    incubator: "",
    phases: [
        {
            name: "investigation",
            start: new Date(),
        },
    ],
};

/* Pure component */
export const StartupInfoCreate = (props: StartupInfoCreateProps) => {
    const save = async (data) => {
        const postData = {
            ...data,
            startup: slugify(data.title),
        };
        return axios
            .post(
                computeRoute(routes.STARTUP_POST_INFO_CREATE_FORM),
                {
                    ...postData,
                },
                {
                    withCredentials: true,
                }
            )
            .then((result) => {
                window.scrollTo({ top: 20, behavior: "smooth" });
                return result;
            })
            .catch((e) => {
                Sentry.captureException(e);
                throw e;
            });
    };
    return (
        <>
            {!!props.updatePullRequest && (
                <div className="notification">
                    ⚠️ Une pull request existe déjà sur cette startup. Quelqu'un
                    doit la merger pour que le changement soit pris en compte.
                    <a href={props.updatePullRequest.html_url} target="_blank">
                        {props.updatePullRequest.html_url}
                    </a>
                    <br />
                    (la prise en compte peut prendre 10 minutes.)
                </div>
            )}
            <div className="beta-banner"></div>
            <div>
                <StartupForm
                    save={save}
                    formData={NEW_PRODUCT_DATA}
                    incubators={props.incubators}
                    sponsors={props.sponsors}
                />
                <br />
                <br />
            </div>
        </>
    );
};

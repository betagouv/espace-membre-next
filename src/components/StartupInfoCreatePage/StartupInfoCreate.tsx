"use client";
import React from "react";

import * as Sentry from "@sentry/nextjs";

import { StartupForm } from "../StartupForm/StartupForm";
import { createStartup } from "@/app/api/startups/actions";
import { Option } from "@/models/misc";

interface StartupInfoCreateProps {
    incubatorOptions: Option[];
    sponsorOptions: Option[];
}

/* Pure component */
export const StartupInfoCreate = (props: StartupInfoCreateProps) => {
    const save = async (data) => {
        await createStartup({
            formData: data,
        })
            .then((result) => {
                window.scrollTo({ top: 20, behavior: "smooth" });
                return result;
            })
            .catch((e) => {
                window.scrollTo({ top: 20, behavior: "smooth" });
                Sentry.captureException(e);
                throw e;
            });
    };
    return (
        <>
            <div className="beta-banner"></div>
            <div>
                <StartupForm
                    save={save}
                    incubatorOptions={props.incubatorOptions}
                    sponsorOptions={props.sponsorOptions}
                />
                <br />
                <br />
            </div>
        </>
    );
};

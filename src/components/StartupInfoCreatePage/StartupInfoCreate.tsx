"use client";
import React from "react";

import * as Sentry from "@sentry/nextjs";
import axios from "axios";

import { Option } from "../CommunityPage";
import { StartupForm, StartupFormProps } from "../StartupForm/StartupForm";
import { createStartup } from "@/app/api/startups/actions";
import { incubatorSchemaType } from "@/models/incubator";
import { sponsorSchemaType } from "@/models/sponsor";
import { StartupPhase } from "@/models/startup";
import routes, { computeRoute } from "@/routes/routes";

interface StartupInfoCreateProps {
    incubatorOptions: Option[];
    sponsorOptions: Option[];
}

/* Pure component */
export const StartupInfoCreate = (props: StartupInfoCreateProps) => {
    const save = async (data) => {
        createStartup({
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

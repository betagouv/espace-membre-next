"use client";

import React from "react";

import * as Sentry from "@sentry/nextjs";

import { IncubatorForm } from "../IncubatorForm/IncubatorForm";
import { createIncubator } from "@/app/api/incubators/actions/createIncubator";
import { Option } from "@/models/misc";

interface IncubatorInfoCreateProps {
    incubatorOptions: Option[];
    sponsorOptions: Option[];
}

/* Pure component */
export const IncubatorCreate = (props: IncubatorInfoCreateProps) => {
    const save = async (data) => {
        await createIncubator({
            incubator: data,
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
                <IncubatorForm
                    save={save}
                    sponsorOptions={props.sponsorOptions}
                />
                <br />
                <br />
            </div>
        </>
    );
};

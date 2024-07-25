"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import * as Sentry from "@sentry/nextjs";
import axios from "axios";

import { StartupForm, StartupFormProps } from "../StartupForm/StartupForm";
import { updateStartup } from "@/app/api/startups/actions";
import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import { startupInfoUpdateSchemaType } from "@/models/actions/startup";
import { incubatorSchemaType } from "@/models/incubator";
import { Option } from "@/models/misc";
import { sponsorSchemaType } from "@/models/sponsor";
import {
    eventSchemaType,
    phaseSchemaType,
    startupSchemaType,
} from "@/models/startup";
import routes, { computeRoute } from "@/routes/routes";
import { routeTitles } from "@/utils/routes/routeTitles";

interface StartupInfoUpdateProps {
    startup: startupSchemaType;
    startupSponsors: sponsorSchemaType[];
    startupPhases: phaseSchemaType[];
    startupEvents: eventSchemaType[];
    incubatorOptions: Option[];
    sponsorOptions: Option[];
}

/* Pure component */
export const StartupInfoUpdate = (props: StartupInfoUpdateProps) => {
    const css = ".panel { overflow: hidden; width: auto; min-height: 100vh; }";

    const save = async (data: startupInfoUpdateSchemaType) => {
        try {
            await updateStartup({
                formData: data,
                startupUuid: props.startup.uuid,
            });
            window.scrollTo({ top: 20, behavior: "smooth" });
            return {
                // ...resp,
                isUpdate: true,
            };
        } catch (e) {
            Sentry.captureException(e);
            console.error(e);
            window.scrollTo({ top: 20, behavior: "smooth" });
            throw e;
        }
    };

    // console.log("formData", props.formData);

    return (
        <>
            <BreadCrumbFiller
                currentPage={routeTitles.startupDetailsEdit(props.startup.name)}
            ></BreadCrumbFiller>
            <div className={fr.cx("fr-mb-5w")}>
                <h1>{routeTitles.startupDetailsEdit(props.startup.name)}</h1>

                <div className="beta-banner"></div>

                {(props.startup && (
                    <StartupForm
                        save={save}
                        startupSponsors={props.startupSponsors}
                        startupPhases={props.startupPhases}
                        startupEvents={props.startupEvents}
                        startup={props.startup}
                        incubatorOptions={props.incubatorOptions}
                        sponsorOptions={props.sponsorOptions}
                    />
                )) || <>Loading...</>}
            </div>
            <style media="screen">{css}</style>
        </>
    );
};

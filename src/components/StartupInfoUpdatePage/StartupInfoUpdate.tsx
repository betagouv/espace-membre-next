"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import * as Sentry from "@sentry/nextjs";

import LastChange from "../LastChange";
import { StartupForm, StartupFormProps } from "../StartupForm/StartupForm";
import { ActionResponse } from "@/@types/serverAction";
import { safeUpdateStartup, updateStartup } from "@/app/api/startups/actions";
import { startupInfoUpdateSchemaType } from "@/models/actions/startup";
import { Option } from "@/models/misc";
import { sponsorSchemaType } from "@/models/sponsor";
import {
    eventSchemaType,
    phaseSchemaType,
    startupSchemaType,
} from "@/models/startup";
import { StartupChangeSchemaType } from "@/models/startupChange";
import { saveImage } from "@/utils/file";
import { routeTitles } from "@/utils/routes/routeTitles";

interface StartupInfoUpdateProps {
    startup: startupSchemaType;
    startupSponsors: sponsorSchemaType[];
    startupPhases: phaseSchemaType[];
    startupEvents: eventSchemaType[];
    incubatorOptions: Option[];
    sponsorOptions: Option[];
    heroURL?: string;
    shotURL?: string;
    changes: StartupChangeSchemaType[];
}

/* Pure component */
export const StartupInfoUpdate = (props: StartupInfoUpdateProps) => {
    const css = ".panel { overflow: hidden; width: auto; min-height: 100vh; }";

    const save = async (
        data: startupInfoUpdateSchemaType,
    ): Promise<ActionResponse> => {
        try {
            const res = await safeUpdateStartup({
                formData: {
                    startup: data.startup,
                    startupEvents: data.startupEvents,
                    startupPhases: data.startupPhases,
                    startupSponsors: data.startupSponsors,
                    newSponsors: data.newSponsors,
                    newPhases: data.newPhases,
                },
                startupUuid: props.startup.uuid,
            });
            if (res.success) {
                if (data.hero) {
                    await saveImage({
                        fileIdentifier: "hero",
                        fileRelativeObjType: "startup",
                        fileObjIdentifier: res.data.ghid,
                        file: data.hero,
                    });
                }
                if (data.shot) {
                    await saveImage({
                        fileIdentifier: "shot",
                        fileRelativeObjType: "startup",
                        fileObjIdentifier: res.data.ghid,
                        file: data.shot,
                    });
                }

                if (data.shouldDeleteHero) {
                    await fetch("/api/image", {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            fileObjIdentifier: res.data.ghid,
                            fileIdentifier: "hero",
                            fileRelativeObjType: "startup",
                        }),
                    });
                }

                if (data.shouldDeleteShot) {
                    await fetch("/api/image", {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            fileObjIdentifier: res.data.ghid,
                            fileIdentifier: "shot",
                            fileRelativeObjType: "startup",
                        }),
                    });
                }
            }
            window.scrollTo({ top: 20, behavior: "smooth" });
            return res;
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
            <div className={fr.cx("fr-mb-5w")}>
                <h1>{routeTitles.startupDetailsEdit(props.startup.name)}</h1>
                <LastChange changes={props.changes} />
                {(props.startup && (
                    <StartupForm
                        save={save}
                        startupSponsors={props.startupSponsors}
                        startupPhases={props.startupPhases}
                        startupEvents={props.startupEvents}
                        startup={props.startup}
                        heroURL={props.heroURL}
                        shotURL={props.shotURL}
                        incubatorOptions={props.incubatorOptions}
                        sponsorOptions={props.sponsorOptions}
                    />
                )) || <>Loading...</>}
            </div>
            <style media="screen">{css}</style>
        </>
    );
};

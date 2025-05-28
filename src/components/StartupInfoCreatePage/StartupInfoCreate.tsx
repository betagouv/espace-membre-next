"use client";
import React from "react";

import * as Sentry from "@sentry/nextjs";
import slugify from "@sindresorhus/slugify";

import { StartupForm } from "../StartupForm/StartupForm";
import { ActionResponse } from "@/@types/serverAction";
import { safeCreateStartup } from "@/app/api/startups/actions";
import { startupInfoUpdateSchemaType } from "@/models/actions/startup";
import { Option } from "@/models/misc";
import { StartupChangeSchemaType } from "@/models/startupChange";
import { saveImage } from "@/utils/file";

interface StartupInfoCreateProps {
    incubatorOptions: Option[];
    sponsorOptions: Option[];
}

/* Pure component */
export const StartupInfoCreate = (props: StartupInfoCreateProps) => {
    const save = async (
        data: startupInfoUpdateSchemaType,
    ): Promise<ActionResponse> => {
        try {
            const res = await safeCreateStartup({
                formData: {
                    startup: data.startup,
                    startupEvents: data.startupEvents,
                    startupPhases: data.startupPhases,
                    startupSponsors: data.startupSponsors,
                    newSponsors: data.newSponsors,
                    newPhases: data.newPhases,
                },
            });
            if (res.success) {
                if (data.hero) {
                    saveImage({
                        fileIdentifier: "hero",
                        fileRelativeObjType: "startup",
                        fileObjIdentifier: res.data.ghid,
                        file: data.hero,
                    });
                }
                if (data.shot) {
                    saveImage({
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
                            fileIdentifer: "hero",
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
                            fileIdentifer: "shot",
                            fileRelativeObjType: "startup",
                        }),
                    });
                }
            }
            return res;
        } catch (e) {
            Sentry.captureException(e);
            throw e;
        }
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

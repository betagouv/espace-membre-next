"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import * as Sentry from "@sentry/nextjs";

import { IncubatorForm } from "../IncubatorForm/IncubatorForm";
import {
    safeUpdateIncubator,
    updateIncubator,
} from "@/app/api/incubators/actions/updateIncubator";
import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import { incubatorUpdateSchemaType } from "@/models/actions/incubator";
import { incubatorSchemaType } from "@/models/incubator";
import { Option } from "@/models/misc";
import { startupSchemaType } from "@/models/startup";
import { saveImage } from "@/utils/file";
import { routeTitles } from "@/utils/routes/routeTitles";

interface IncubatorUpdateProps {
    incubator: incubatorSchemaType;
    sponsorOptions: Option[];
    startupOptions: Option[];
}

/* Pure component */
export const IncubatorUpdate = (props: IncubatorUpdateProps) => {
    const css = ".panel { overflow: hidden; width: auto; min-height: 100vh; }";

    const save = async (data: incubatorUpdateSchemaType) => {
        try {
            const res = await safeUpdateIncubator({
                incubator: data.incubator,
                incubatorUuid: props.incubator.uuid,
            });
            if (res.success) {
                if (data.logo) {
                    saveImage({
                        fileIdentifier: "logo",
                        fileRelativeObjType: "incubator",
                        fileObjIdentifier: data.incubator.ghid,
                        file: data.logo,
                    });
                }

                if (data.shouldDeleteLogo) {
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
            <BreadCrumbFiller
                currentPage={routeTitles.incubatorDetailsEdit(
                    props.incubator.title
                )}
            ></BreadCrumbFiller>
            <div className={fr.cx("fr-mb-5w")}>
                <h1>
                    {routeTitles.incubatorDetailsEdit(props.incubator.title)}
                </h1>

                <div className="beta-banner"></div>

                {(props.incubator && (
                    <IncubatorForm
                        save={save}
                        incubator={props.incubator}
                        startupOptions={props.startupOptions}
                        sponsorOptions={props.sponsorOptions}
                    />
                )) || <>Loading...</>}
            </div>
            <style media="screen">{css}</style>
        </>
    );
};

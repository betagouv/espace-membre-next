"use client";
import React from "react";

import axios from "axios";
import { DBPullRequest } from "@/models/pullRequests";
import routes, { computeRoute } from "@/routes/routes";
import { StartupForm } from "../StartupForm/StartupForm";
import {
    StartupAPIData,
    StartupFrontMatter,
    StartupPhase,
} from "@/models/startup";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { routeTitles } from "@/utils/routes/routeTitles";
import { PullRequestWarning } from "../PullRequestWarning";

// import style manually
export interface StartupInfoFormData {
    sponsors?: string[];
    incubator?: string;
    mission?: string;
    stats_url?: string;
    link?: string;
    dashlord_url?: string;
    repository?: string;
    image?: string;
}

export interface StartupInfoUpdateProps {
    formData: StartupFrontMatter & { markdown: string };

    updatePullRequest?: DBPullRequest;
}

/* Pure component */
export const StartupInfoUpdate = (props: StartupInfoUpdateProps) => {
    const css = ".panel { overflow: hidden; width: auto; min-height: 100vh; }";

    const save = async (data, image) => {
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
            console.error(e);
        }
    };
    console.log(props);
    return (
        <>
            <div>
                <h1>{routeTitles.startupDetailsEdit(props.formData.title)}</h1>

                {!!props.updatePullRequest && (
                    <PullRequestWarning url={props.updatePullRequest.url} />
                )}

                <div className="beta-banner"></div>

                <StartupForm
                    content={props.formData.markdown}
                    save={save}
                    startup={{ attributes: { name: props.formData.title } }}
                    phases={props.formData.phases?.map((phase) => ({
                        //...phase,
                        name: phase.name as StartupPhase, // WTH
                        start: phase.start.toString(),
                        end: phase.end && phase.end.toString(),
                    }))}
                    link={props.formData.link}
                    dashlord_url={props.formData.dashlord_url}
                    stats_url={props.formData.stats_url}
                    mission={props.formData.mission}
                    repository={props.formData.repository}
                    incubator={props.formData.incubator}
                    sponsors={props.formData.sponsors}
                    accessibility_status={props.formData.accessibility_status}
                    analyse_risques={props.formData.analyse_risques}
                    analyse_risques_url={props.formData.analyse_risques_url}
                    contact={props.formData.contact}
                />
            </div>
            <style media="screen">{css}</style>
        </>
    );
};

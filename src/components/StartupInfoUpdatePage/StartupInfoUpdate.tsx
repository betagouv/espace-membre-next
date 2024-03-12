"use client";
import React from "react";

import axios from "axios";
import routes, { computeRoute } from "@/routes/routes";
import { routeTitles } from "@/utils/routes/routeTitles";
import { StartupFrontMatter, StartupPhase } from "@/models/startup";
import { GithubAPIPullRequest } from "@/lib/github";
import { StartupForm } from "../StartupForm/StartupForm";
import { PullRequestWarning } from "../PullRequestWarning";
import { fr } from "@codegouvfr/react-dsfr";

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
    updatePullRequest?: GithubAPIPullRequest;
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
            window.scrollTo({ top: 20, behavior: "smooth" });
            throw e;
        }
    };

    return (
        <>
            <div className={fr.cx("fr-mb-5w")}>
                <h1>{routeTitles.startupDetailsEdit(props.formData.title)}</h1>

                {!!props.updatePullRequest && (
                    <PullRequestWarning
                        url={props.updatePullRequest.html_url}
                    />
                )}

                <div className="beta-banner"></div>

                <StartupForm
                    content={props.formData.markdown}
                    save={save}
                    startup={{ attributes: { name: props.formData.title } }}
                    phases={props.formData.phases?.map((phase) => ({
                        //...phase,
                        name: phase.name as StartupPhase, // WTH
                        start: phase.start.toISOString().substring(0, 10),
                        end:
                            phase.end &&
                            phase.end.toISOString().substring(0, 10),
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

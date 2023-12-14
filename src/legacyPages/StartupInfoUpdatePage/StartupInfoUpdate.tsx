"use client";
import React from "react";

import axios from "axios";
import { DBPullRequest } from "@/models/pullRequests";
import routes, { computeRoute } from "@/routes/routes";
import { StartupForm } from "../../components/StartupForm/StartupForm";
import { StartupInfo, StartupPhase } from "@/models/startup";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { routeTitles } from "@/utils/routes/routeTitles";

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
    title: string;
    currentUserId: string;
    errors: string[];
    messages: string[];
    activeTab: string;
    subActiveTab: string;
    request: Request;
    formData: StartupInfoFormData;
    startup: StartupInfo;
    formValidationErrors: any;
    startupOptions: {
        value: string;
        label: string;
    }[];
    username: string;
    updatePullRequest?: DBPullRequest;
    isAdmin: boolean;
}

/* Pure component */
export const StartupInfoUpdate = (props: StartupInfoUpdateProps) => {
    const css = ".panel { overflow: hidden; width: auto; min-height: 100vh; }";

    const save = async (data, image) => {
        try {
            const resp = await axios.post(
                computeRoute(routes.STARTUP_POST_INFO_UPDATE_FORM).replace(
                    ":startup",
                    props.startup.id
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
            console.log(e);
        }
    };

    return (
        <>
            <div>
                <h1>
                    {routeTitles.startupDetailsEdit(
                        props.startup.attributes.name
                    )}
                </h1>
                {!!props.updatePullRequest && (
                    <Alert
                        className="fr-mb-8v"
                        severity="warning"
                        small={true}
                        closable={false}
                        title="Une pull request existe déjà sur cette fiche."
                        description={
                            <>
                                {`Toi ou un membre de ton équipe doit la merger
                                pour que les changements soient pris en compte : `}
                                <a
                                    className="fr-link"
                                    href={props.updatePullRequest.url}
                                    target="_blank"
                                >
                                    {props.updatePullRequest.url}
                                </a>
                                <br />
                                (la prise en compte peut prendre 10 minutes.)
                            </>
                        }
                    />
                )}
                <div className="beta-banner"></div>
                <StartupForm
                    content={
                        props.startup.attributes.content_url_encoded_markdown
                    }
                    save={save}
                    startup={props.startup}
                    phases={
                        props.startup.attributes.phases as unknown as {
                            start: string;
                            end?: string | undefined;
                            name: StartupPhase;
                        }[]
                    }
                    link={props.formData.link}
                    dashlord_url={props.formData.dashlord_url}
                    stats_url={props.formData.stats_url}
                    mission={props.formData.mission}
                    repository={props.formData.repository}
                    incubator={props.formData.incubator}
                    sponsors={props.formData.sponsors}
                    accessibility_status={
                        props.startup.attributes.accessibility_status
                    }
                    analyse_risques={props.startup.attributes.analyse_risques}
                    analyse_risques_url={
                        props.startup.attributes.analyse_risques_url
                    }
                    contact={props.startup.attributes.contact}
                />
            </div>
            <style media="screen">{css}</style>
        </>
    );
};

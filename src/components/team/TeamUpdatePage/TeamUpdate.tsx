"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import * as Sentry from "@sentry/nextjs";

import { TeamForm } from "../TeamForm/TeamForm";
import { updateTeam } from "@/app/api/teams/actions/updateTeam";
import { teamUpdateSchemaType } from "@/models/actions/team";
import {
    memberBaseInfoSchemaType,
    memberPublicInfoSchemaType,
} from "@/models/member";
import { Option } from "@/models/misc";
import { teamSchemaType } from "@/models/team";
import { routeTitles } from "@/utils/routes/routeTitles";

interface TeamUpdateProps {
    team: teamSchemaType;
    incubatorOptions: Option[];
    members: memberPublicInfoSchemaType[];
    teamMembers: memberPublicInfoSchemaType[];
}

/* Pure component */
export const TeamUpdate = (props: TeamUpdateProps) => {
    const css = ".panel { overflow: hidden; width: auto; min-height: 100vh; }";

    const save = async (data: teamUpdateSchemaType) => {
        try {
            await updateTeam({
                teamWrapper: data,
                teamUuid: props.team.uuid,
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
            <div className={fr.cx("fr-mb-5w")}>
                <h1>{routeTitles.teamDetailsEdit(props.team.name)}</h1>

                <div className="beta-banner"></div>

                {(props.team && (
                    <TeamForm
                        save={save}
                        members={props.members}
                        teamMembers={props.teamMembers}
                        team={props.team}
                        incubatorOptions={props.incubatorOptions}
                    />
                )) || <>Loading...</>}
            </div>
            <style media="screen">{css}</style>
        </>
    );
};

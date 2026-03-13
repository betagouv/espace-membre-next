"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";

import { TeamForm } from "../TeamForm/TeamForm";
import { safeUpdateTeam } from "@/app/api/teams/actions/updateTeam";
import { teamUpdateSchemaType } from "@/models/actions/team";
import { memberPublicInfoSchemaType } from "@/models/member";
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
    const result = await safeUpdateTeam({
      teamWrapper: data,
      teamUuid: props.team.uuid,
    });
    window.scrollTo({ top: 20, behavior: "smooth" });
    return result;
  };

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

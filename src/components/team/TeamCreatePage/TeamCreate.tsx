"use client";

import React from "react";

import { TeamForm } from "../TeamForm/TeamForm";
import { safeCreateTeam } from "@/app/api/teams/actions/createTeam";
import { memberBaseInfoSchemaType } from "@/models/member";
import { Option } from "@/models/misc";

interface TeamInfoCreateProps {
  incubatorOptions: Option[];
  members: memberBaseInfoSchemaType[];
}

/* Pure component */
export const TeamCreate = (props: TeamInfoCreateProps) => {
  const save = async (data) => {
    const result = await safeCreateTeam({
      teamWrapper: data,
    });
    window.scrollTo({ top: 20, behavior: "smooth" });
    return result;
  };
  return (
    <>
      <div className="beta-banner"></div>
      <div>
        <TeamForm
          save={save}
          members={props.members}
          incubatorOptions={props.incubatorOptions}
        />
        <br />
        <br />
      </div>
    </>
  );
};

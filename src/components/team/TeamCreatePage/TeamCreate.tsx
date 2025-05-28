"use client";

import React from "react";

import * as Sentry from "@sentry/nextjs";

import { TeamForm } from "../TeamForm/TeamForm";
import { createTeam } from "@/app/api/teams/actions/createTeam";
import { memberBaseInfoSchemaType } from "@/models/member";
import { Option } from "@/models/misc";

interface TeamInfoCreateProps {
  incubatorOptions: Option[];
  members: memberBaseInfoSchemaType[];
}

/* Pure component */
export const TeamCreate = (props: TeamInfoCreateProps) => {
  const save = async (data) => {
    await createTeam({
      teamWrapper: data,
    })
      .then((result) => {
        window.scrollTo({ top: 20, behavior: "smooth" });
        return result;
      })
      .catch((e) => {
        window.scrollTo({ top: 20, behavior: "smooth" });
        Sentry.captureException(e);
        throw e;
      });
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

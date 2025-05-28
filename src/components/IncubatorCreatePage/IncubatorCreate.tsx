"use client";

import React from "react";

import * as Sentry from "@sentry/nextjs";

import { IncubatorForm } from "../IncubatorForm/IncubatorForm";
import {
  createIncubator,
  safeCreateIncubator,
} from "@/app/api/incubators/actions/createIncubator";
import { incubatorUpdateSchemaType } from "@/models/actions/incubator";
import { Option } from "@/models/misc";
import { saveImage } from "@/utils/file";

interface IncubatorInfoCreateProps {
  sponsorOptions: Option[];
  startupOptions: Option[];
}

/* Pure component */
export const IncubatorCreate = (props: IncubatorInfoCreateProps) => {
  const save = async (data: incubatorUpdateSchemaType) => {
    try {
      const res = await safeCreateIncubator({
        incubator: data.incubator,
      });
      if (res.success) {
        if (data.logo) {
          saveImage({
            fileIdentifier: "logo",
            fileRelativeObjType: "incubator",
            fileObjIdentifier: res.data.ghid,
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
      window.scrollTo({ top: 20, behavior: "smooth" });
      Sentry.captureException(e);
      throw e;
    }
  };
  return (
    <>
      <div className="beta-banner"></div>
      <div>
        <IncubatorForm
          save={save}
          sponsorOptions={props.sponsorOptions}
          startupOptions={props.startupOptions}
        />
        <br />
        <br />
      </div>
    </>
  );
};

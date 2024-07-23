"use client";

import React from "react";

import * as Sentry from "@sentry/nextjs";

import { OrganizationForm } from "../OrganizationForm/OrganizationForm";
import { createOrganization } from "@/app/api/organizations/actions/createOrganization";

interface organizationInfoCreateProps {}

/* Pure component */
export const OrganizationCreate = (props: organizationInfoCreateProps) => {
    const save = async (data) => {
        console.log("KCS CREATE ORGANI 0");
        await createOrganization({
            organization: data,
        })
            .then((result) => {
                console.log("KCS CREATE ORGANI 1");

                window.scrollTo({ top: 20, behavior: "smooth" });
                return result;
            })
            .catch((e) => {
                console.log("KCS CREATE ORGANI 2");

                window.scrollTo({ top: 20, behavior: "smooth" });
                Sentry.captureException(e);
                throw e;
            });
    };
    return (
        <>
            <div className="beta-banner"></div>
            <div>
                <OrganizationForm save={save} />
                <br />
                <br />
            </div>
        </>
    );
};

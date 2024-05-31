"use client";
import React from "react";

import { CommunityProps } from ".";
import { CommunityFilterMembers } from "./CommunityFilterMembers";
import { CommunitySearchMember } from "./CommunitySearchMember";

/* Pure component */
export const Community = (props: CommunityProps) => {
    return (
        <>
            <CommunitySearchMember {...props} />
            <CommunityFilterMembers {...props} />
        </>
    );
};

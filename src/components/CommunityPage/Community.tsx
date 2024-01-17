"use client";
import React from "react";

import { CommunitySearchMember } from "./CommunitySearchMember";
import { CommunityFilterMembers } from "./CommunityFilterMembers";
import { CommunityProps } from ".";

/* Pure component */
export const Community = (props: CommunityProps) => {
    return (
        <>
            <CommunitySearchMember {...props} />
            <CommunityFilterMembers {...props} />
        </>
    );
};

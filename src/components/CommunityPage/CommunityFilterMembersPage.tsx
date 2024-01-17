import React from 'react'

import { CommunityFilterMembers } from './CommunityFilterMembers';
import { CommunityProps } from '.';

/* Pure component */
export const CommunityFilterMembersPage = (props: CommunityProps) => {

    return <>
        <div className="module">
            <CommunityFilterMembers {...props}/>
        </div>
    </>
}

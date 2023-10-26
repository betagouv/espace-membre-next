import React from 'react'

import { CommunitySearchMember } from './CommunitySearchMember'
import { CommunityProps } from '.';

/* Pure component */
export const CommunitySearchMemberPage = (props: CommunityProps) => {

    return <>
        <div className="module">
            <CommunitySearchMember {...props}/>
        </div>
    </>
}

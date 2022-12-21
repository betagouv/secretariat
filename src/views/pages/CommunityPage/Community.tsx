import React from 'react'

import { InnerPageLayout } from '../components/InnerPageLayout';
import { hydrateOnClient } from '../../hydrateOnClient'
import { CommunitySearchMember } from './CommunitySearchMember'
import { CommunityFilterMembers } from './CommunityFilterMembers';
import { CommunityProps } from '.';

/* Pure component */
export const Community = InnerPageLayout((props: CommunityProps) => {

    return <>
        <div className="module">
            <CommunitySearchMember {...props}/>
            <CommunityFilterMembers {...props}/>
        </div>
    </>
})

hydrateOnClient(Community)

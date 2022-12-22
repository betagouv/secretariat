import React from 'react'

import { InnerPageLayout } from '../components/InnerPageLayout';
import { hydrateOnClient } from '../../hydrateOnClient'
import { CommunityFilterMembers } from './CommunityFilterMembers';
import { CommunityProps } from '.';

/* Pure component */
export const CommunityFilterMembersPage = InnerPageLayout((props: CommunityProps) => {

    return <>
        <div className="module">
            <CommunityFilterMembers {...props}/>
        </div>
    </>
})

hydrateOnClient(CommunityFilterMembersPage)

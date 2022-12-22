import React from 'react'

import { InnerPageLayout } from '../components/InnerPageLayout';
import { hydrateOnClient } from '../../hydrateOnClient'
import { CommunitySearchMember } from './CommunitySearchMember'
import { CommunityProps } from '.';

/* Pure component */
export const CommunitySearchMemberPage = InnerPageLayout((props: CommunityProps) => {

    return <>
        <div className="module">
            <CommunitySearchMember {...props}/>
        </div>
    </>
})

hydrateOnClient(CommunitySearchMemberPage)

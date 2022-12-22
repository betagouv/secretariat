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
            <div>
                <small>
                    <a href="/account">Communauté</a> &gt; <a href="">Rechercher un ou une membre</a>
                </small>
            </div>
            <div className="margin-top-m"></div>
            <CommunitySearchMember {...props}/>
            <CommunityFilterMembers {...props}/>
        </div>
    </>
})

hydrateOnClient(Community)

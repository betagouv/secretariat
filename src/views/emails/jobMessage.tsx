import React from 'react'
import { hydrateOnClient } from '../hydrateOnClient'
import { Domaine } from '../../models/member'
import { Job } from '../../models/job'

interface Props {
  jobs: Job[],
  domaine: Domaine
}

/* Pure component */
export const JobMessage = function ({ jobs, domaine }: Props) {
  const content = [`Nouvelles offre pour le domaine : ${domaine}`,
    `${jobs.map(job => {
        return[`------------------------------`,
        `${job.title.trim()}`,
        `${job.content.slice(0, 230)}`
        ].join('\r\n')
    })}`].join('\r\n')
  return <>{content}</>
}

hydrateOnClient(JobMessage)

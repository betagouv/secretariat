import React from 'react'
import { hydrateOnClient } from '../hydrateOnClient'
import { Job } from '../../models/job'
import { Domaine } from '../../models/member'

interface Props {
  jobs: Job[],
  domaine: Domaine
}

/* Pure component */
export const JobMessage = function ({ jobs, domaine }: Props) {
  return (`
    Nouvelles offre pour le domaine : ${domaine}
    ${jobs.forEach(job => {
        return`
        ------------------------------
        ${job.title.trim()}
        ${job.content.slice(0, 230)}
        `
    })} 
  `)
}

hydrateOnClient(JobMessage)

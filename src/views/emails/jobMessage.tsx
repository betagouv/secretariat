import React from 'react'
import { hydrateOnClient } from '../hydrateOnClient'
import { Domaine, Member } from '../../models/member'
import { Job } from '../../models/job'

interface Props {
  jobs: Job[],
  domaine: Domaine
}

/* Pure component */
export const JobMessage = function ({ jobs, domaine }: Props) {
  const content = [`Nouvelles offre pour le domaine : ${domaine}`,
    `${jobs.map(job => {
        return[`-`,
        `${job.title.trim()}`,
        `${job.content.slice(0, 230)}`
        ].join('\r\n')
    })}`].join('\r\n')
  return <>{content}</>
}

hydrateOnClient(JobMessage)

interface JobMessageLongTimeOpenedProps {
  member: Member,
  job: Job
}

export const JobMessageLongTimeOpened = function ({ job, member }: JobMessageLongTimeOpenedProps) {
  const content = `Bonjour ${member.fullname},
  L'offre [${job.title}](${job.url}) est ouverte depuis longtemps.
  Si elle n'est plus d'actualité tu peux la fermer en mettant l'attribut 'open' à false.
  `
  return <>{content}</>
}

hydrateOnClient(JobMessageLongTimeOpened)


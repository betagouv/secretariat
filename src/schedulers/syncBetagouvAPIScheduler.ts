import { buildBetaEmail, checkUserIsExpired } from '../controllers/utils';
import BetaGouv from '../betagouv';
import db from '../db';
import { Domaine, Member } from '../models/member';
import { makeMarkdownContent } from '../views/index.html';
import { JobMessage,  JobMessageLongTimeOpened } from '../views/emails/jobMessage';
import { Job } from '../models/job';
import { getUserByEmail, MattermostUser } from '../lib/mattermost'

export const JobMessageMd = (props: Parameters<typeof JobMessageMd>[0]) =>
  makeMarkdownContent({
    Component: JobMessage,
    props,
})

export const JobMessageLongTimeOpenedMd = (props: Parameters<typeof JobMessageLongTimeOpenedMd>[0]) =>
  makeMarkdownContent({
    Component: JobMessageLongTimeOpened,
    props,
})


export async function syncBetagouvUserAPI() {
  let members : Member[] = await BetaGouv.usersInfos()
  members = members.filter(member => !checkUserIsExpired(member))
  for (const member of members) {
    await db('users').update({
      domaine: member.domaine
    }).where({
      username: member.id
    });
  }
}

export async function publishJobsToMattermost(jobs=undefined) {
  if (!jobs) {
    jobs = await BetaGouv.getJobs() as Job[]
    const now = new Date();
    jobs = jobs.filter(job => new Date(job.published) > now)
  }
  const domaines = {
    'Animation': 'animation',
    'Coaching': 'coaching',
    'Déploiement': 'deploiement',
    'Design': 'design',
    'Développement': 'dev',
    'Intraprenariat': 'intraprenariat',
    'Produit': 'produit',
    'Autre': 'autre',
  }
  for (const domaine of Object.values(Domaine)) {
    const jobsForDomaine = jobs.filter(job => (job.domaines || []).includes(domaine))
    if (jobsForDomaine.length) {
      const jobMessage = JobMessageMd({
        jobs: jobsForDomaine,
        domaine
      })
      await BetaGouv.sendInfoToChat(
        jobMessage,
        `incubateur-embauche-${domaines[domaine]}`
      );
    }
  }
}

export async function sendMessageToTeamForJobOpenedForALongTime(jobs=undefined) {
  console.log(`Lancement du cron pour les messages de rappel de fermeture d'offre`)
  if (!jobs) {
    jobs = await BetaGouv.getJobs() as Job[]
    const today = new Date();
    const todayLess45days = new Date()
    todayLess45days.setDate(today.getDate() - 45)
    jobs = jobs.filter(job => new Date(job.published) < todayLess45days)
  }
  const startups_details = await BetaGouv.startupInfos()
  const users = await BetaGouv.usersInfos()
  for(const job of jobs) {
    const startup = startups_details[job.startup]
    let contact: Member
    if (job.contacts) {
      contact = users.find(user => user.id === job.contacts)
    }
    if (!contact) {
      contact = startup.active_members.map(active_member => {
        return users.find(user => user.id === active_member)
      }).find(user => user.domaine = Domaine.INTRAPRENARIAT)
    }
    if (!contact) {
      const mattermostUser : MattermostUser = await getUserByEmail(buildBetaEmail(contact.id))
      if (mattermostUser && mattermostUser.username === 'lucas.charrier') {
        const JobMessageLongTimeOpened = JobMessageLongTimeOpenedMd({
          member: contact,
          job,
        })
        await BetaGouv.sendInfoToChat(
          JobMessageLongTimeOpened,
          'secretariat',
          mattermostUser.username
        );
        console.log(`Message de rappel pour fermer l'offre envoyer à ${mattermostUser.username}`)
      }
    }
  }
}


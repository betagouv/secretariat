import { checkUserIsExpired } from '../controllers/utils';
import BetaGouv from '../betagouv';
import db from '../db';
import { Domaine, Member } from '../models/member';
import { makeHtmlEmail } from '../views/index.html';
import { JobMessage } from '../views/emails/jobMessage';
import { Job } from 'src/models/job';

export const JobMessageHtml = (props: Parameters<typeof JobMessageHtml>[0]) =>
  makeHtmlEmail({
    Component: JobMessage,
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

export async function publishJobsToMattermost(jobs) {
  if (!jobs) {
    jobs = await BetaGouv.getJobs() as Job[]
    const now = new Date();
    jobs = jobs.filter(job => new Date(job.published) > now)
  }
  for (const domaine of Object.values(Domaine)) {
    const jobsForDomaine = jobs.filter(job => (job.domaines || []).includes(domaine))
    const jobMessage = JobMessageHtml({
      jobs: jobsForDomaine,
      domaine
    })
    await BetaGouv.sendInfoToChat(
      jobMessage,
      'embauche-test'
    );
  }
}


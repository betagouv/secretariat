import ejs from 'ejs';

import betagouv from "@/betagouv";
import { Job } from "@/models/job";
import { Domaine } from "@/models/member";

export async function publishJobsToMattermost(jobs=undefined) {
    if (!jobs) {
      jobs = await betagouv.getJobs() as Job[]
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
        const jobMessage = await ejs.renderFile('./src/views/templates/emails/jobMessage.ejs', {
          jobs: jobsForDomaine,
          domaine
        })
        await betagouv.sendInfoToChat(
          jobMessage,
          `incubateur-embauche-${domaines[domaine]}`
        );
      }
    }
  }


  
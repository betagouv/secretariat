import ejs from 'ejs'

import betagouv from "@/betagouv";
import { JobWTTJ } from "@/models/job";

export async function publishJobsWTTJToMattermost(jobs=undefined) {
    if (!jobs) {
      jobs = await betagouv.getJobsWTTJ() as JobWTTJ[]
      const now = new Date();
      jobs = jobs.filter(job => new Date(job.published_at) > now)
    }
  
    if (jobs.length) {
      const jobMessage = await ejs.renderFile('./src/views/templates/emails/jobWTTJMessage.ejs', {
        jobs
      })
      await betagouv.sendInfoToChat(
        jobMessage,
        `incubateur-embauche`
      );
    }
  }
  
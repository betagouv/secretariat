import ejs from 'ejs'

import betagouv from "@/betagouv";
import { buildBetaEmail } from "@/controllers/utils";
import { MattermostUser, getUserByEmail } from "@/lib/mattermost";
import { Job } from "@/models/job";
import { Member, Domaine } from "@/models/member";
import { Startup } from "@/models/startup";

export async function sendMessageToTeamForJobOpenedForALongTime(jobs=undefined) {
    console.log(`Lancement du cron pour les messages de rappel de fermeture d'offre`)
    if (!jobs) {
      jobs = await betagouv.getJobs() as Job[]
      const today = new Date();
      const todayLess45days = new Date()
      todayLess45days.setDate(today.getDate() - 45)
      jobs = jobs.filter(job => new Date(job.published) < todayLess45days)
    }
    const startups_details : Startup[] = await betagouv.startupsInfos()
    const users = await betagouv.usersInfos()
    for(const job of jobs) {
      const startup = startups_details.find(startup => startup.id === job.startup);
      if (!startup) {
        continue
      }
      let contact: Member
      if (job.contacts) {
        contact = users.find(user => user.id === job.contacts)
      }
      if (!contact) {
        contact = startup.active_members.map(active_member => {
          return users.find(user => user.id === active_member)
        }).find(user => user.domaine = Domaine.INTRAPRENARIAT)
      }
      if (contact) {
        const mattermostUser : MattermostUser = await getUserByEmail(buildBetaEmail(contact.id))
        if (mattermostUser) {
          const JobMessageLongTimeOpened = await ejs.renderFile('./src/views/templates/emails/reminderJobMessage.ejs', {
            member: contact,
            job,
          })
          await betagouv.sendInfoToChat(
            JobMessageLongTimeOpened,
            'secretariat',
            mattermostUser.username
          );
          console.log(`Message de rappel pour fermer l'offre envoyer à ${mattermostUser.username}`)
        }
      }
    }
  }
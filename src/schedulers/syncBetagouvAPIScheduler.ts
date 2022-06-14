import ejs from 'ejs';
import { buildBetaEmail, createDefaultObjectWithKeysAndValue, formatDateToISOString, sortASC } from '../controllers/utils';
import BetaGouv from '../betagouv';
import db from '../db';
import { Domaine, Member } from '../models/member';
import { Job } from '../models/job';
import { getUserByEmail, MattermostUser } from '../lib/mattermost'
import { Startup } from '../models/startup';


export const chartBdd =  async (users=[]) => {
  const result = {
    'employer': {
      'admin': [],
      'independent': [],
      'service': [],
    },
    'domaineOverDate': {
      'Déploiement': [],
      'Design': [],
      'Développement': [],
      'Coaching': [],
      'Autre': [],
      'Intraprenariat': [],
      'Animation': [],
      'Produit': [],
    },
    'gender': {
      'NSP': [],
      'male': [],
      'female': [],
      'other': []
    },
    'domaine': {
      'Déploiement': 0,
      'Design': 0,
      'Développement': 0,
      'Coaching': 0,
      'Autre': 0,
      'Intraprenariat': 0,
      'Animation': 0,
      'Produit': 0
    },
    'total': 0
  }

  const now = new Date()
  for (const user of users) {
    const missions = user['missions']
    for (const mission of missions) {
      const startDate = mission['start'];
      const endDate = mission['end'];
      result['employer'][mission['status']] = startDate && startDate != '' ? {date: startDate, increment: 1} : undefined;
      result['employer'][mission['status']] = endDate && endDate != '' ? {date: endDate, increment: -1} : undefined ;
      result['domaineOverDate'][user['domaine']] = startDate && startDate != '' ? {date: startDate, increment: 1} : undefined;
      result['domaineOverDate'][user['domaine']] = endDate && endDate != '' ? {date: endDate, increment: -1} : undefined;
      result['gender'][user.gender] = {date: startDate, increment: -1}
      result['gender'][user.gender] = {date: endDate, increment: -1}
      if (user['missions'].length && user['missions'][user.missions.length-1]['end'] >= now) {
        result['domaine'][user['domaine']] = result['domaine'][user['domaine']] + 1
        result['total'] = result['total'] + 1 
      }
    }
  }
  const datasets = {}; 
  // keys to use for the datasets
  const employerTypes = Object.keys(result['employer'])

  /** 
  *   Work around Chart.js' unability to stack time series unless they explicitly share their abscissa,
  *   by adding neutral data points to all datasets whenever another changes.
  *   dataByDate : each key is a date, and contains an obj with the datasets' keys 
  *   and their corresponding values for the date, 0 (neutral value) if none.
  */
  const dataByDate = {};
  const today = new Date()
  for (const employerType of employerTypes) {
      datasets[employerType] = []
      result['employer'][employerType].forEach(function(event) {
          // Round departure to next month
          if(event.increment === -1) {
              const oldDate = new Date(event.date);
              event.date = formatDateToISOString(new Date(oldDate.getFullYear(), oldDate.getMonth() + 1, 1));
          }
          event.date = event.date.slice(0, -2) + '01' // replace day by first day of the month
          if (event.date < today) {
              // use previous obj for date if exist, else define a default obj
              dataByDate[event.date] = dataByDate[event.date] || createDefaultObjectWithKeysAndValue(employerType, 0)
              dataByDate[event.date][employerType] += event.increment
          }
      });
  };
  const domaineTypes = Object.keys(result['domaineOverDate'])
  for (const domaineType of domaineTypes) {
    datasets[domaineType] = []
    result['domaineOverDate'][domaineType].forEach(function(event) {
        // Round departure to next month
        if(event.increment === -1) {
            const oldDate = new Date(event.date);
            event.date = formatDateToISOString(new Date(oldDate.getFullYear(), oldDate.getMonth() + 1, 1));
        }
        event.date = event.date.slice(0, -2) + '01' // replace day by first day of the month
        if (event.date < today) {
            // use previous obj for date if exist, else define a default obj
            dataByDate[event.date] = dataByDate[event.date] || createDefaultObjectWithKeysAndValue(domaineType, 0)
            dataByDate[event.date][domaineType] += event.increment
        }
    });
  };

  const genderTypes = Object.keys(result['gender'])
  for (const genderType of genderTypes) {
    datasets[genderType] = []
    result['gender'][genderType].forEach(function(event) {
        // Round departure to next month
        if(event.increment === -1) {
            const oldDate = new Date(event.date);
            event.date = formatDateToISOString(new Date(oldDate.getFullYear(), oldDate.getMonth() + 1, 1));
        }
        event.date = event.date.slice(0, -2) + '01' // replace day by first day of the month
        if (event.date < today) {
            // use previous obj for date if exist, else define a default obj
            dataByDate[event.date] = dataByDate[event.date] || createDefaultObjectWithKeysAndValue(genderType, 0)
            dataByDate[event.date][genderType] += event.increment
        }
    });
  };
  // Chart.defaults.scale.gridLines.display = false;

  // use dataByDate to define each points and corresponding values
  // for each datasets we compute the value for each new points by adding all values from previous date
  const currentAmounts = createDefaultObjectWithKeysAndValue([
    ...employerTypes,
    ...genderTypes,
    ...domaineTypes
  ], 0)

  for (const date of Object.keys(dataByDate).sort(sortASC)) {
    const row = dataByDate[date]
    Object.keys(row).forEach(function(type){
        currentAmounts[type] += row[type];
        datasets[type].push({
            x: date,
            y: currentAmounts[type]
        })
    })
    // await db('missions').insert({
    //   date,
    //   admin: currentAmounts['admin'],
    //   independent: currentAmounts['independent'],
    //   service: currentAmounts['service'],
    //   Animation:  currentAmounts['Animation'],
    //   Coaching: currentAmounts['Coaching'],
    //   Déploiement: currentAmounts['Déploiement'],
    //   Design: currentAmounts['Design'],
    //   Développement: currentAmounts['Développement'],
    //   Intraprenariat: currentAmounts['Animation'],
    //   Produit: currentAmounts['Produit'],
    //   Autre: currentAmounts['Autre']
    // })
  }
  return datasets
}

export async function syncBetagouvUserAPI() {
  const members : Member[] = await BetaGouv.usersInfos()
  await db('missions').truncate()
  for (const member of members) {
    await db('users').update({
      domaine: member.domaine,
      missions: JSON.stringify(member.missions)
    }).where({
      username: member.id
    })
  }
}

export async function buildMissionsBDD() {
  const users = await db('users')
  const datasets = await chartBdd(users)
  return datasets
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
      const jobMessage = await ejs.renderFile('./src/views/templates/emails/jobMessage.ejs', {
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
  const startups_details : Startup[] = await BetaGouv.startupInfos()
  const users = await BetaGouv.usersInfos()
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


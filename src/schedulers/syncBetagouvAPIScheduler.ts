import ejs from 'ejs';
import { buildBetaEmail, createDefaultObjectWithKeysAndValue, formatDateToISOString, sortASC } from '../controllers/utils';
import BetaGouv from '../betagouv';
import db from '../db';
import { Domaine, Member } from '../models/member';
import { Job } from '../models/job';
import { getUserByEmail, MattermostUser } from '../lib/mattermost'
import { Startup } from '../models/startup';

const convert = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

export const chartBdd =  async (users=[]) => {
  const result = {
    'employer': {
      'admin': [],
      'independent': [],
      'service': [],
    },
    'domaineOverDate': {
      'deploiement': [],
      'design': [],
      'developpement': [],
      'coaching': [],
      'autre': [],
      'intraprenariat': [],
      'animation': [],
      'produit': [],
    },
    'gender': {
      'nsp': [],
      'male': [],
      'female': [],
      'other': []
    },
    'domaine': {
      'deploiement': 0,
      'design': 0,
      'developpement': 0,
      'coaching': 0,
      'autre': 0,
      'intraprenariat': 0,
      'animation': 0,
      'produit': 0
    },
    'total': 0
  }

  const now = new Date()
  for (const user of users) {
    const missions = user['missions'] || []
    for (const mission of missions) {
      const startDate = mission['start'];
      const endDate = mission['end'];
      if (startDate && startDate != '') {
        result['employer'][mission['status']].push({date: startDate, increment: 1})
        result['domaineOverDate'][convert(user.domaine)].push({date: startDate, increment: 1})
        result['gender'][convert(user.gender)].push({date: startDate, increment: 1})
      }
      if (endDate && endDate != '') {
        result['employer'][mission['status']].push({date: endDate, increment: -1})
        result['domaineOverDate'][convert(user.domaine)].push({date: endDate, increment: -1})
        result['gender'][convert(user.gender)].push({date: endDate, increment: -1})
      }
      if (user['missions'].length && user['missions'][user.missions.length-1]['end'] >= now) {
        result['domaine'][convert(user.domaine)] = result['domaine'][convert(user.domaine)] + 1
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
  const today = formatDateToISOString(new Date())
  for (const employerType of employerTypes) {
      datasets[employerType] = []
      for (const event of result.employer[employerType]) {
          // Round departure to next month
          if(event.increment === -1) {
              const oldDate = new Date(event.date);
              event.date = formatDateToISOString(new Date(oldDate.getFullYear(), oldDate.getMonth() + 1, 1));
          }
          event.date = event.date.slice(0, -2) + '01' // replace day by first day of the month
          if (event.date < today) {
              console.log('Event employer', event)
              // use previous obj for date if exist, else define a default obj
              dataByDate[event.date] = dataByDate[event.date] || createDefaultObjectWithKeysAndValue(employerTypes, 0)
              dataByDate[event.date][employerType] += event.increment
          }
      };
  };
  const domaineTypes = Object.keys(result.domaineOverDate)
  for (const domaineType of domaineTypes) {
    datasets[domaineType] = []
    for (const event of result.domaineOverDate[domaineType]) {
        // Round departure to next month
        if(event.increment === -1) {
            const oldDate = new Date(event.date);
            event.date = formatDateToISOString(new Date(oldDate.getFullYear(), oldDate.getMonth() + 1, 1));
        }
        event.date = event.date.slice(0, -2) + '01' // replace day by first day of the month
        if (event.date < today) {
            console.log('Event domaine', event)
            // use previous obj for date if exist, else define a default obj
            dataByDate[event.date] = dataByDate[event.date] || createDefaultObjectWithKeysAndValue(domaineTypes, 0)
            dataByDate[event.date][domaineType] += event.increment
        }
    };
  };

  const genderTypes = Object.keys(result.gender)
  for (const genderType of genderTypes) {
    datasets[genderType] = []
    for (const event of result.gender[genderType]) {
        // Round departure to next month
        if(event.increment === -1) {
            const oldDate = new Date(event.date);
            event.date = formatDateToISOString(new Date(oldDate.getFullYear(), oldDate.getMonth() + 1, 1));
        }
        event.date = event.date.slice(0, -2) + '01' // replace day by first day of the month
        if (event.date < today) {
            console.log('Event gender', event)
            // use previous obj for date if exist, else define a default obj
            dataByDate[event.date] = dataByDate[event.date] || createDefaultObjectWithKeysAndValue(genderTypes, 0)
            dataByDate[event.date][genderType] += event.increment
        }
    };
  };
  // Chart.defaults.scale.gridLines.display = false;

  // use dataByDate to define each points and corresponding values
  // for each datasets we compute the value for each new points by adding all values from previous date
  const currentAmounts = createDefaultObjectWithKeysAndValue([
    ...employerTypes,
    ...genderTypes,
    ...domaineTypes
  ], 0)
  for (const type of [
    ...employerTypes,
    ...genderTypes,
    ...domaineTypes
  ]) {
    datasets[type] = datasets[type] || []
  }
  console.log(Object.keys(datasets))
  for (const date of Object.keys(dataByDate).sort(sortASC)) {
    const row = dataByDate[date]
    console.log('LCS ROW', row)
    for (const type of Object.keys(row)){
        currentAmounts[type] += row[type];
        datasets[type].push({
            x: date,
            y: currentAmounts[type]
        })
    }
    await db('chart').insert({
      date,
      admin: currentAmounts['admin'],
      independent: currentAmounts['independent'],
      service: currentAmounts['service'],
      animation:  currentAmounts['animation'],
      coaching: currentAmounts['coaching'],
      deploiement: currentAmounts['deploiement'],
      design: currentAmounts['design'],
      developpement: currentAmounts['developpement'],
      intraprenariat: currentAmounts['dnimation'],
      produit: currentAmounts['produit'],
      autre: currentAmounts['autre'],
      other: currentAmounts['other'],
      nsp: currentAmounts['nsp'],
      male: currentAmounts['male'],
      female: currentAmounts['female']
    })
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

export async function buildChartBDD() {
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


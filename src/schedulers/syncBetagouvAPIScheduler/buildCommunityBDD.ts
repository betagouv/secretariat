import { createDefaultObjectWithKeysAndValue, formatDateToISOString, sortASC } from "@/controllers/utils"
import db from "@/db"

const convert = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

export const communityBdd =  async (users=[]) => {
    await db('community').truncate()
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
    const domaineTypes = Object.keys(result.domaineOverDate)
    const genderTypes = Object.keys(result.gender)
    const TYPES = [
      ...employerTypes,
      ...genderTypes,
      ...domaineTypes
    ]
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
                // use previous obj for date if exist, else define a default obj
                dataByDate[event.date] = dataByDate[event.date] || createDefaultObjectWithKeysAndValue(TYPES, 0)
                dataByDate[event.date][employerType] += event.increment
            }
        };
    };
  
  
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
              // use previous obj for date if exist, else define a default obj
              dataByDate[event.date] = dataByDate[event.date] || createDefaultObjectWithKeysAndValue(TYPES, 0)
              dataByDate[event.date][domaineType] += event.increment
          }
      };
    };
  
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
              // use previous obj for date if exist, else define a default obj
              dataByDate[event.date] = dataByDate[event.date] || createDefaultObjectWithKeysAndValue(TYPES, 0)
              dataByDate[event.date][genderType] += event.increment
          }
      };
    };
    // Chart.defaults.scale.gridLines.display = false;
  
    // use dataByDate to define each points and corresponding values
    // for each datasets we compute the value for each new points by adding all values from previous date
    const currentAmounts = createDefaultObjectWithKeysAndValue(TYPES, 0)
    for (const type of [
      ...employerTypes,
      ...genderTypes,
      ...domaineTypes
    ]) {
      datasets[type] = datasets[type] || []
    }
    for (const date of Object.keys(dataByDate).sort(sortASC)) {
      const row = dataByDate[date]
      for (const type of Object.keys(row)){
          currentAmounts[type] += row[type];
          datasets[type].push({
              x: date,
              y: currentAmounts[type]
          })
      }
      await db('community').insert({
        date,
        admin: currentAmounts['admin'] || 0,
        independent: currentAmounts['independent'] || 0,
        service: currentAmounts['service'] || 0,
        animation:  currentAmounts['animation'] || 0,
        coaching: currentAmounts['coaching'] || 0,
        deploiement: currentAmounts['deploiement'] || 0,
        design: currentAmounts['design'] || 0,
        developpement: currentAmounts['developpement'] || 0,
        intraprenariat: currentAmounts['intraprenariat'] || 0,
        produit: currentAmounts['produit'] || 0,
        autre: currentAmounts['autre'] || 0,
        other: currentAmounts['other'] || 0,
        nsp: currentAmounts['nsp'] || 0,
        male: currentAmounts['male'] || 0,
        female: currentAmounts['female'] || 0
      })
    }
    return datasets
  }

export async function buildCommunityBDD() {
    const users = await db('users')
    const datasets = await communityBdd(users)
    return datasets
}
  
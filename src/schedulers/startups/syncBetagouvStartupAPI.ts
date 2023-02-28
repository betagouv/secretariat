import * as Sentry from '@sentry/node';

import betagouv from "@/betagouv";
import config from "@/config";
import { sendEmail } from "@/config/email.config";
import db from "@/db";
import { DBStartup, StartupInfo, StartupPhase } from "@/models/startup";
import { EMAIL_TYPES } from "@/modules/email";
import { nbOfDaysBetweenDate } from '@/controllers/utils';

function getCurrentPhase(startup : StartupInfo) {
  return startup.attributes.phases ? startup.attributes.phases[startup.attributes.phases.length - 1].name : undefined
}

function getCurrentPhaseDate(startup : StartupInfo) : Date | null {
  let date;
  if (startup.attributes.phases) {
    date = startup.attributes.phases[startup.attributes.phases.length - 1].start || undefined
    if (date) {
      date = new Date(date)
    }
  }
  console.log('Get current phase date', date)
  return date
}

function isRecent(phaseDate: Date) {
  const TWO_MONTHS_IN_DAYS = 30*2
  return nbOfDaysBetweenDate(phaseDate, new Date()) < TWO_MONTHS_IN_DAYS
}

async function compareAndTriggerChange(newStartupInfo : DBStartup, previousStartupInfo: DBStartup) {
  if (previousStartupInfo && newStartupInfo.current_phase !== previousStartupInfo.current_phase) {
    const startupInfos = await betagouv.startupInfosById(newStartupInfo.id)
    const phase = startupInfos.phases.find(phase => phase.name === newStartupInfo.current_phase)
    const phaseDate = new Date(phase.start)
    if (isRecent(phaseDate)) {
      if (newStartupInfo.current_phase === StartupPhase.PHASE_CONSTRUCTION) {
        if (newStartupInfo.mailing_list) {
          sendEmail({
            toEmail: [`${newStartupInfo.mailing_list}@${config.domain}`],
            type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE,
            variables: {
              startup: newStartupInfo.id
            }
          })
        }
      } else if (newStartupInfo.current_phase === StartupPhase.PHASE_ACCELERATION) {
        if (newStartupInfo.mailing_list) {
          sendEmail({
            toEmail: [`${newStartupInfo.mailing_list}@${config.domain}`],
            type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_ACCELERATION_PHASE,
            variables: {
              startup: newStartupInfo.id
            }
          })
        }
      }
    }
    console.info(`Changement de phase de startups pour ${newStartupInfo.id}`)
  }
}

export async function syncBetagouvStartupAPI() {
    const startups : StartupInfo[] = await betagouv.startupsInfos();
    for (const startup of startups) {
      const previousStartupInfo : DBStartup = await db('startups').where({ id: startup.id }).first()
      const newStartupInfo = {
        id: startup.id,
        name: startup.attributes.name,
        pitch: startup.attributes.pitch,
        stats_url: startup.attributes.stats_url,
        link: startup.attributes.link,
        repository: startup.attributes.repository,
        contact: startup.attributes.contact,
        phases: JSON.stringify(startup.attributes.phases),
        current_phase: getCurrentPhase(startup),
        current_phase_date: getCurrentPhaseDate(startup),
        mailing_list: previousStartupInfo ? previousStartupInfo.mailing_list : undefined,
        incubator: startup.relationships ? startup.relationships.incubator.data.id : undefined,
      }
      if (previousStartupInfo) {
        await db('startups').update(newStartupInfo)
        .where({
          id: startup.id
        })
      } else {
        await db('startups').insert(newStartupInfo)
      }
      try {
        await compareAndTriggerChange({
          ...newStartupInfo,
          phases: startup.attributes.phases,
        }, previousStartupInfo)
      } catch (e) {
        Sentry.captureException(e);
        console.error(e)
      }
    }
  }

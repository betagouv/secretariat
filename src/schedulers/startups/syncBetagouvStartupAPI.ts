import betagouv from "@/betagouv";
import config from "@/config";
import { sendEmail } from "@/config/email.config";
import db from "@/db";
import { DBStartup, StartupInfo } from "@/models/startup";
import { EMAIL_TYPES } from "@/modules/email";

function getCurrentPhase(startup : StartupInfo) {
  return startup.attributes.phases ? startup.attributes.phases[startup.attributes.phases.length - 1].name : undefined
}

enum Phase {
  PHASE_INVESTIGATION='investigation',
  PHASE_CONSTRUCTION='construction',
  PHASE_ACCELERATION='acceleration',
}

async function compareAndTriggerChange(newStartupInfo : DBStartup, previousStartupInfo: DBStartup) {
  if (previousStartupInfo && newStartupInfo.current_phase !== previousStartupInfo.current_phase) {
    const startupInfos = await betagouv.startupInfosById(newStartupInfo.id)
    console.log(startupInfos.active_members)
    if (newStartupInfo.current_phase === Phase.PHASE_CONSTRUCTION) {
      if (newStartupInfo.mailing_list) {
        sendEmail({
          toEmail: [`${newStartupInfo.mailing_list}@${config.domain}`],
          type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE,
          variables: {
            startup: newStartupInfo.id
          }
        })
      }
    } else if (newStartupInfo.current_phase === Phase.PHASE_ACCELERATION) {
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
      await compareAndTriggerChange({
        ...newStartupInfo,
        phases: startup.attributes.phases,
      }, previousStartupInfo)
    }
  }
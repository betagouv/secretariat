import betagouv from "@/betagouv";
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

function compareAndTriggerChange(newStartupInfo : DBStartup, previousStartupInfo: DBStartup) {
  if (previousStartupInfo && newStartupInfo.current_phase !== previousStartupInfo.current_phase) {
    if (newStartupInfo.current_phase === Phase.PHASE_CONSTRUCTION) {
      sendEmail({
        type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE,
        variables: {}
      })
    } else if (newStartupInfo.current_phase === Phase.PHASE_ACCELERATION) {
      sendEmail({
        type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_ACCELERATION_PHASE,
        variables: {}
      })
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
      compareAndTriggerChange({
        ...newStartupInfo,
        phases: startup.attributes.phases,
      }, previousStartupInfo)
    }
  }
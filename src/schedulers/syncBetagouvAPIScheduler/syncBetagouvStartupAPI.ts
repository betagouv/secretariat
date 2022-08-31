import betagouv from "@/betagouv";
import db from "@/db";
import { StartupInfo } from "@/models/startup";

export async function syncBetagouvStartupAPI() {
    const startups : StartupInfo[] = await betagouv.startupsInfos();
    await db('startups').truncate()
    for (const startup of startups) {
      await db('startups').insert({
        id: startup.id,
        name: startup.attributes.name,
        pitch: startup.attributes.pitch,
        stats_url: startup.attributes.stats_url,
        link: startup.attributes.link,
        repository: startup.attributes.repository,
        contact: startup.attributes.contact,
        phases: JSON.stringify(startup.attributes.phases),
        current_phase: startup.attributes.phases ? startup.attributes.phases[startup.attributes.phases.length - 1].name : undefined,
        incubator: startup.relationships ? startup.relationships.incubator.data.id : undefined,
      })
      .onConflict('id')
      .merge();
    }
  }
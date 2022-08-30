import betagouv from "@/betagouv"
import { computeHash } from "@/controllers/utils"
import db from "@/db"
import { DBUser } from "@/models/dbUser"
import { Member } from "@/models/member"
import { DBMission, Mission } from "@/models/mission"

export async function syncBetagouvUserAPI() {
    const members : Member[] = await betagouv.usersInfos()
    await db('users_startups').truncate()
    for (const member of members) {
      const [user] : DBUser[] = await db('users').update({
        domaine: member.domaine,
        missions: JSON.stringify(member.missions),
        startups: member.startups
      }).where({
        username: member.id
      }).returning('*')
      const startups = member.startups || []
      for (const startup of startups) {
        await db('users_startups').insert({
          startup_id: startup,
          user_id: member.id
        })
      }
      const missions : Mission[] = member.missions
      for (const mission of missions) {
        if (member.startups && member.startups.length) {
            for (const startup of startups) {
                const memberMission : Omit<DBMission, 'id'> = {
                    username: member.id,
                    startup: startup,
                    status: mission.status,
                    employer: mission.employer,
                    start: new Date(mission.start),
                    end: new Date(mission.end)
                }
                await db('missions').insert(memberMission)
            }
        } else {
            const memberMission : Omit<DBMission, 'id' | 'startup'> = {
                username: member.id,
                status: mission.status,
                employer: mission.employer,
                start: new Date(mission.start),
                end: new Date(mission.end)
            }
            await db('missions').insert(memberMission)
        }
      }
      if (user) {
        await db('user_details').insert({
          hash: computeHash(member.id),
          domaine: member.domaine,
          active: user.primary_email_status === 'EMAIL_ACTIVE'
        })
        .onConflict('hash')
        .merge();
      }
    }
  }
  
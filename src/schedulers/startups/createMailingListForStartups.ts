import betagouv from "@/betagouv"
import db from "@/db"
import { CommunicationEmailCode, DBUser } from "@/models/dbUser"
import { ACTIVE_PHASES, Startup, StartupPhase } from "@/models/startup"
import { generateMailingListName } from "."

function getCurrentPhase(startup : Startup) : StartupPhase {
    return startup.phases ? startup.phases[startup.phases.length - 1].name : undefined
}

const createMailingListForStartup = async(startup: Startup) => { 
    const mailingListName = generateMailingListName(startup)
    return betagouv.createMailingList(mailingListName)
}

const addAndRemoveMemberToMailingListForStartup = async(startup: Startup) => {
    const mailingListName = generateMailingListName(startup)
    const dbUsers : DBUser[] = await db('users').whereIn('username', startup.active_members)
    const emails = dbUsers.map(dbUser => {
        let email = dbUser.primary_email
        if (dbUser.communication_email === CommunicationEmailCode.SECONDARY && dbUser.secondary_email) {
            email = dbUser.secondary_email
        }
        return email
    })
    const subscribers = await betagouv.getMailingListSubscribers(mailingListName)
    for (const email of emails.filter(email => subscribers.includes(email))) {
        betagouv.subscribeToMailingList(mailingListName, email)
    }
    for (const subscriber of subscribers.filter(subscriber => !emails.includes(subscriber))) {
        betagouv.unsubscribeFromMailingList(mailingListName, subscriber)
    }
}
  
export const createMailingListForStartups = async () => {
    const mailingLists : string[] = await betagouv.getAllMailingList()
    const startupDetails : Startup[] = await betagouv.startupInfos()
    console.log(`Will create ${startupDetails.length} mailing lists`)
    for (const startup of startupDetails) {
        const phase = getCurrentPhase(startup)
        if (ACTIVE_PHASES.includes(phase)) {
            try {
                if (!mailingLists.includes(generateMailingListName(startup))) {
                    await createMailingListForStartup(startup)
                }
                await db('startups').where({
                    id: startup.id
                }).update({
                    mailing_list: generateMailingListName(startup)
                })
                await addAndRemoveMemberToMailingListForStartup(startup)
                console.log(`Create mailing list for : ${generateMailingListName(startup)}`)
            } catch (e) {
                console.error(e)
            }
        }
    }
}


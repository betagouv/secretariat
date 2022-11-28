import betagouv from "@/betagouv"
import db from "@/db"
import { CommunicationEmailCode, DBUser } from "@/models/dbUser"
import axios from "axios"
import { generateMailingListName, StartupDetail, StartupPhase } from "."

const ACTIVE_PHASES = [
    StartupPhase.PHASE_ACCELERATION,
    StartupPhase.PHASE_CONSTRUCTION,
    StartupPhase.PHASE_INVESTIGATION
]

function getCurrentPhase(startup : StartupDetail) {
    return startup.phases ? startup.phases[startup.phases.length - 1].name : undefined
}

const createMailingListForStartup = async(startup: StartupDetail) => { 
    const mailingListName = generateMailingListName(startup)
    return betagouv.createMailingList(mailingListName)
}

const addAndRemoveMemberToMailingListForStartup = async(startup: StartupDetail) => {
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
    const startupDetails : Record<string,StartupDetail> = await axios.get(`https://beta.gouv.fr/api/v2.3/startups_details.json`).then(res => res.data)
    console.log(`Will create ${Object.keys(startupDetails).length} mailing lists`)
    for (const startupId of Object.keys(startupDetails)) {
        const startup = startupDetails[startupId]
        const phase = getCurrentPhase(startup)
        if (ACTIVE_PHASES.includes(phase)) {
            try {
                if (process.env.CREATE_MAILING_LIST) {
                    if (!mailingLists.includes(generateMailingListName(startup))) {
                        await createMailingListForStartup(startup)
                    }
                    db('startups').where({
                        id: startup.id
                    }).update({
                        mailing_list: generateMailingListName(startup)
                    })
                    await addAndRemoveMemberToMailingListForStartup(startup)
                }
                console.log(`Create mailing list for : ${generateMailingListName(startup)}`)
            } catch (e) {
                console.error(e)
            }
        }
    }
}


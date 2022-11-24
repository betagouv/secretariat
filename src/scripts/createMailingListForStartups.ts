import betagouv from "@/betagouv"
import db from "@/db"
import { CommunicationEmailCode, DBUser } from "@/models/dbUser"
import axios from "axios"

interface StartupDetail {
    active_members: string[],
    id: string,
    phases: {
        name: StartupPhase,
        start: string
    }[]
}

enum StartupPhase {
    PHASE_INVESTIGATION="investigation",
    PHASE_CONSTRUCTION="construction",
    PHASE_ACCELERATION="acceleration",
    PHASE_TRANSFER="transfer",
    PHASE_SUCCESS="success"
}

const ACTIVE_PHASES = [
    StartupPhase.PHASE_ACCELERATION,
    StartupPhase.PHASE_CONSTRUCTION,
    StartupPhase.PHASE_INVESTIGATION
]

function getCurrentPhase(startup : StartupDetail) {
    return startup.phases ? startup.phases[startup.phases.length - 1].name : undefined
}

const generateMailingListName = (startup: StartupDetail) : string => {
    return `startup-info-${startup.id}`;
}
const createMailingListForStartup = async(startup: StartupDetail) => { 
    const mailingListName = generateMailingListName(startup)
    return betagouv.createMailingList(mailingListName)
}

const addAndRemoveMemberToMailingListForStartup = async(startup) => {
    const mailingListName = generateMailingListName(startup)
    const dbUsers : DBUser[] = await db('users').whereIn('username', startup.member)
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
  
const createMailingLists = async () => {
    const mailingLists : string[] = await betagouv.getAllMailingList()
    const startupDetails : Record<string,StartupDetail> = await axios.get(`https://beta.gouv.fr/api/v2.3/startups_details.json`).then(res => res.data)
    console.log(`Will create ${Object.keys(startupDetails).length} mailing lists`)
    for (const startupId of Object.keys(startupDetails)) {
        const startup = startupDetails[startupId]
        const phase = getCurrentPhase(startup)
        if (!ACTIVE_PHASES.includes(phase)) {
            // La startup n'est plus une se de l'incubateur
            return
        }
        try {
            if (process.env.CREATE_MAILING_LIST) {
                if (!mailingLists.includes(generateMailingListName(startup))) {
                    await createMailingListForStartup(startup)
                }
                await addAndRemoveMemberToMailingListForStartup(startup)
            }
            console.log(`Create mailing list for : ${startup.id}`)
        } catch (e) {
            console.error(e)
        }
    }
}

createMailingLists().then(() => {
    console.log('Create mailing lists done.')
})


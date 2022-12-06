import { getAllTransacBlockedContacts, smtpBlockedContactsEmailDelete } from "@/config/email.config"
import betagouv from "@/betagouv"

export async function unblockEmailsThatAreActive() {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(startDate.getMonth() - 6)
    const contacts = await getAllTransacBlockedContacts({ startDate, endDate, senders: [
        'espace-membre@beta.gouv.fr',
        'espace-membre@incubateur.net',
        'contact@beta.gouv.fr'
    ], offset: 0 })
    const activeEmails = await betagouv.getAllEmailInfos()
    const contactEmails = contacts.map(contact => contact.email) 
    const emailsToBeUnblocked = contactEmails.filter(email => activeEmails.includes(email))
    console.log(`Email to unblocked`, JSON.stringify(emailsToBeUnblocked))
    for (const email in emailsToBeUnblocked) {
        if (process.env.FEATURE_UNBLOCK_CONTACT_EMAIL) {
            await smtpBlockedContactsEmailDelete({ email })
        }
    }
}
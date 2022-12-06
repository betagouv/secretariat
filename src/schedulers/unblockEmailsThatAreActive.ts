import { getAllContacts, getAllTransacBlockedContacts, smtpBlockedContactsEmailDelete } from "@/config/email.config"
import betagouv from "@/betagouv"

export async function unblockEmailsThatAreActive() {
    const startDate = new Date()
    const endDate = new Date()
    startDate.setMonth(startDate.getMonth() - 6)
    let contacts = await getAllContacts({ offset: 0})
    contacts = contacts.filter(c => c.emailBlacklisted)
    const transacContacts = await getAllTransacBlockedContacts({ startDate, endDate, senders: [
        'espace-membre@beta.gouv.fr',
        'espace-membre@incubateur.net',
        'contact@beta.gouv.fr'
    ], offset: 0 })
    const activeEmails = await betagouv.getAllEmailInfos()
    const contactEmails = [...transacContacts, ...contacts].map(contact => contact.email) 
    const emailsToBeUnblocked = contactEmails.filter(email => activeEmails.includes(email))
    console.log(`Email to unblocked`, JSON.stringify(emailsToBeUnblocked))
    for (const email in emailsToBeUnblocked) {
        if (process.env.FEATURE_UNBLOCK_CONTACT_EMAIL || process.env.NODE_ENV==='test') {
            await smtpBlockedContactsEmailDelete({ email })
        }
    }
}

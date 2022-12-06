import { getAllContactsFromList, getAllTransacBlockedContacts, smtpBlockedContactsEmailDelete } from "@/config/email.config"
import betagouv from "@/betagouv"
import { MAILING_LIST_TYPE } from "@/modules/email"

export async function unblockEmailsThatAreActive() {
    const startDate = new Date()
    const endDate = new Date()
    startDate.setMonth(startDate.getMonth() - 6)
    let contacts = await getAllContactsFromList({ listId: MAILING_LIST_TYPE.NEWSLETTER })
    contacts = contacts.filter(c => c.emailBlacklisted)
    console.log('Blacklisted contacts', contacts)
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

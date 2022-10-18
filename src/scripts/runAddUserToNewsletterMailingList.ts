import knex from "../db";
import { CommunicationEmailCode, DBUser, EmailStatusCode } from "@/models/dbUser/dbUser";
import { makeSendinblue } from "@/infra/email/sendInBlue";
import { MAILING_LIST_TYPE } from "@/modules/email";

const addUsersToSendInBlueMailingList = async () => {
    const dbUsers: DBUser[] = await knex('users').where({
        primary_email_status: EmailStatusCode.EMAIL_ACTIVE
    })
    let communication_emails = dbUsers.map(user => user.communication_email === CommunicationEmailCode.PRIMARY ? user.primary_email : user.secondary_email)
    communication_emails = communication_emails.filter(communication_email => communication_email)
    const mailingService = makeSendinblue({
        MAIL_SENDER: process.env.MAIL_SENDER,
        SIB_APIKEY_PUBLIC: process.env.SIB_APIKEY_PUBLIC,
        SIB_APIKEY_PRIVATE: process.env.SIB_APIKEY_PRIVATE,
        htmlBuilder: null
    })
    for (const communication_email of communication_emails) {
        await mailingService.addContactToMailingLists({
            listTypes: [MAILING_LIST_TYPE.NEWSLETTER], 
            email: communication_email
        })
        console.log(`Email ${communication_email} added to mailing list`)
    }
}

addUsersToSendInBlueMailingList().then(() => {
    console.log('Users add to mailing list')
})

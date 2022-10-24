import knex from "../db";
import { CommunicationEmailCode, DBUser, EmailStatusCode } from "@/models/dbUser/dbUser";
import { makeSendinblue } from "@/infra/email/sendInBlue";
import { Contact, MAILING_LIST_TYPE } from "@/modules/email";
import { capitalizeWords } from "@/controllers/utils";

const addUsersToSendInBlueMailingList = async () => {
    const dbUsers: DBUser[] = await knex('users').where({
        primary_email_status: EmailStatusCode.EMAIL_ACTIVE
    })
    let contacts : Contact[] = dbUsers.map(user => ({
        email: user.communication_email === CommunicationEmailCode.PRIMARY ? user.primary_email : user.secondary_email,
        firstname: capitalizeWords(user.username.split('.')[0]),
        lastname: capitalizeWords(user.username.split('.')[1])
    }))
    contacts = contacts.filter(contact => contact.email)
    contacts = contacts.map(contact => ({
        ...contact,
        email: contact.email.toLowerCase()
    }))
    const mailingService = makeSendinblue({
        MAIL_SENDER: process.env.MAIL_SENDER,
        SIB_APIKEY_PUBLIC: process.env.SIB_APIKEY_PUBLIC,
        SIB_APIKEY_PRIVATE: process.env.SIB_APIKEY_PRIVATE,
        htmlBuilder: null
    })
    await mailingService.addContactsToMailingLists({
        listTypes: [MAILING_LIST_TYPE.NEWSLETTER], 
        contacts
    })
}

addUsersToSendInBlueMailingList().then(() => {
    console.log('Users add to mailing list')
})

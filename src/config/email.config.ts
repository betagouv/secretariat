
import { AddContactsToMailingLists, GetAllContacts, GetAllTransacBlockedContacts, IMailingService, RemoveContactsFromMailingList, SendCampaignEmail, SendEmail, SmtpBlockedContactsEmailDelete, UpdateContactEmail } from '@modules/email'
import { fakeAddContactsToMailingLists, fakeGetAllTransacBlockedContacts, fakeRemoveContactsFromMailingList, fakeSendCampaignEmail, fakeSendEmail, fakeSmtpBlockedContactsEmailDelete, fakeUpdateContactEmail, makeSendEmailNodemailer, fakeGetAllContacts } from '@infra/email'
import { makeSendinblue } from '@infra/email/sendInBlue'
import htmlBuilder from '@modules/htmlbuilder/htmlbuilder'

let sendEmail: SendEmail = fakeSendEmail
let addContactsToMailingLists: AddContactsToMailingLists = fakeAddContactsToMailingLists
let removeContactsFromMailingList: RemoveContactsFromMailingList = fakeRemoveContactsFromMailingList
let sendCampaignEmail: SendCampaignEmail = fakeSendCampaignEmail
let updateContactEmail: UpdateContactEmail = fakeUpdateContactEmail
let smtpBlockedContactsEmailDelete: SmtpBlockedContactsEmailDelete = fakeSmtpBlockedContactsEmailDelete
let getAllTransacBlockedContacts: GetAllTransacBlockedContacts = fakeGetAllTransacBlockedContacts
let getAllContacts: GetAllContacts = fakeGetAllContacts

enum MAIL_SERVICES {
  mailjet='mailjet',
  SendinBlue='SendinBlue',
  malspons='mailspons'
}

export const buildEmailHeader : Record<MAIL_SERVICES, Record<'standart'|'campaign', any>> = {
  mailjet: {
    standart: () => ({ 'X-Mailjet-TrackOpen': '0', 'X-Mailjet-TrackClick': '0' }),
    campaign: (id) => {
      return {
        'X-Mailjet-Campaign': id,
        'X-Mailjet-TrackOpen': '1',
        'X-Mailjet-TrackClick': '1',
      }
    }
  },
  SendinBlue: {
    standart: () => ({ 'X-Mailjet-TrackOpen': '0', 'X-Mailjet-TrackClick': '0' }),
    campaign: (id) => {
      return {}
    }
  },
  mailspons: {
    standart: () => ({}),
    campaign: () => {
      return {}
    }
  }
}

export const EMAIL_CONFIG =  {
    MAIL_DEBUG: process.env.MAIL_DEBUG,
    MAIL_HOST: process.env.MAIL_HOST,
    MAIL_IGNORE_TLS: process.env.MAIL_IGNORE_TLS,
    MAIL_PASS: process.env.MAIL_PASS,
    MAIL_PORT: process.env.MAIL_PORT,
    MAIL_SENDER: process.env.MAIL_SENDER || 'espace-membre@incubateur.net',
    MAIL_SERVICE: process.env.MAIL_SERVICE,
    MAIL_USER: process.env.MAIL_USER,
    SIB_APIKEY_PUBLIC: process.env.SIB_APIKEY_PUBLIC,
    SIB_APIKEY_PRIVATE: process.env.SIB_APIKEY_PRIVATE,
}

const {
    MAIL_DEBUG,
    MAIL_HOST,
    MAIL_IGNORE_TLS,
    MAIL_PASS,
    MAIL_PORT,
    MAIL_SENDER,
    MAIL_SERVICE,
    MAIL_USER,
    SIB_APIKEY_PUBLIC,
    SIB_APIKEY_PRIVATE,
} = EMAIL_CONFIG

if (process.env.NODE_ENV !== 'test') {

  try {
    const sendInBlue = makeSendinblue({
      MAIL_SENDER,
      SIB_APIKEY_PUBLIC,
      SIB_APIKEY_PRIVATE,
      htmlBuilder
    })
    const emailer : IMailingService = process.env.MAIL_USE_SIB ? sendInBlue : { sendEmail:makeSendEmailNodemailer({
        MAIL_DEBUG,
        MAIL_HOST,
        MAIL_IGNORE_TLS,
        MAIL_PASS,
        MAIL_PORT,
        MAIL_SENDER,
        MAIL_SERVICE,
        MAIL_SERVICE_HEADERS: MAIL_SERVICE ? buildEmailHeader[EMAIL_CONFIG.MAIL_SERVICE]['standart']() : {},
        MAIL_USER,
        htmlBuilder
    }
    )}
    if (process.env.MAIL_USE_SIB) {
      console.log('Emails will be sent using Sendinblue')
    } else {
      console.log('Emails will be sent using Nodemailer')
    }
    sendEmail = emailer.sendEmail
    sendCampaignEmail = sendInBlue.sendCampaignEmail
    addContactsToMailingLists = sendInBlue.addContactsToMailingLists
    removeContactsFromMailingList = sendInBlue.removeContactsFromMailingList
    updateContactEmail = sendInBlue.updateContactEmail
    smtpBlockedContactsEmailDelete = sendInBlue.smtpBlockedContactsEmailDelete
    getAllTransacBlockedContacts = sendInBlue.getAllTransacBlockedContacts
    getAllContacts = sendInBlue.getAllContacts
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
} else {
  console.log('Emails will go through a FAKE email service (no mails sent).')
}

export {
    sendEmail,
    addContactsToMailingLists,
    sendCampaignEmail,
    removeContactsFromMailingList,
    updateContactEmail,
    smtpBlockedContactsEmailDelete,
    getAllTransacBlockedContacts, 
    getAllContacts
}

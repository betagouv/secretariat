
import { SendEmail } from '@modules/email'
import { fakeSendEmail, makeSendEmailNodemailer } from '@infra/email'
import { makeSendEmailFromSendinblue } from '@infra/email/sendInBlue'
import htmlBuilder from '@modules/htmlbuilder/htmlbuilder'

let sendEmail: SendEmail = fakeSendEmail

const EMAIL_CONFIG =  {
    MAIL_DEBUG: process.env.MAIL_DEBUG,
    MAIL_HOST: process.env.MAIL_HOST,
    MAIL_IGNORE_TLS: process.env.MAIL_IGNORE_TLS,
    MAIL_PASS: process.env.MAIL_PASS,
    MAIL_PORT: process.env.MAIL_PORT,
    MAIL_SENDER: process.env.MAIL_SENDER || 'espace-membre@incubateur.net',
    MAIL_SERVICE: process.env.MAIL_SERVICE,
    MAIL_USER: process.env.MAIL_USER,
    SIB_APIKEY_PUBLIC: process.env.SIB_APIKEY_PUBLIC,
    SIB_APIKEY_PRIVATE: process.env.SIB_APIKEY_PRIVATE
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

if (process.env.NODE_ENV === 'prod') {

  try {
    sendEmail = process.env.MAIL_USE_SIB ? makeSendEmailFromSendinblue({
      MAIL_SENDER,
      SIB_APIKEY_PUBLIC,
      SIB_APIKEY_PRIVATE,
      htmlBuilder
    }) : makeSendEmailNodemailer({
        MAIL_DEBUG,
        MAIL_HOST,
        MAIL_IGNORE_TLS,
        MAIL_PASS,
        MAIL_PORT,
        MAIL_SENDER,
        MAIL_SERVICE,
        MAIL_SERVICE_HEADERS: { 'X-Mailjet-TrackOpen': '0', 'X-Mailjet-TrackClick': '0' },
        MAIL_USER,
        htmlBuilder
    })
    if (process.env.MAIL_USE_SIB) {
      console.log('Emails will be sent using Sendinblue')
    } else {
      console.log('Emails will be sent using Nodemailer')
    }
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
} else {
  console.log('Emails will go through a FAKE email service (no mails sent).')
}

export {
    sendEmail,
}

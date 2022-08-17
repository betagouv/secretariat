import nodemailer from 'nodemailer';
import { EmailProps, SendEmail, SendEmailProps } from '../../modules/email';

const TEMPLATE_URL_BY_TYPE: Record<EmailProps['type'], string> = {
  'MARRAINAGE_NEWCOMER_EMAIL': './src/views/templates/emails/marrainageRequest.ejs',
  'MARRAINAGE_ONBOARDER_EMAIL': './src/views/templates/emails/marrainageRequest.ejs',
}

interface SendEmailFromNodemailerDeps {
    MAIL_DEBUG: string,
    MAIL_HOST: string,
    MAIL_SERVICE: string,
    MAIL_PORT: string,
    MAIL_USER: string,
    MAIL_PASS: string,
    MAIL_IGNORE_TLS: string,
    MAIL_SERVICE_HEADERS: Record<string, string>,
    MAIL_SENDER: string,
    htmlBuilder: any
}

export const makeSendEmailNodemailer = (deps: SendEmailFromNodemailerDeps): SendEmail => {
    const { 
        MAIL_DEBUG,
        MAIL_HOST,
        MAIL_SERVICE,
        MAIL_PORT,
        MAIL_USER,
        MAIL_PASS,
        MAIL_IGNORE_TLS,
        MAIL_SENDER,
        MAIL_SERVICE_HEADERS,
        htmlBuilder
    } = deps
    const mailTransport = nodemailer.createTransport({
        debug: MAIL_DEBUG === 'true',
        service: MAIL_SERVICE ? MAIL_SERVICE : null,
        host: MAIL_SERVICE ? null : MAIL_HOST,
        port: MAIL_SERVICE
          ? null
          : parseInt(MAIL_PORT || '25', 10),
        ignoreTLS: MAIL_SERVICE
          ? null
          : MAIL_IGNORE_TLS === 'true',
        auth: {
          user: MAIL_USER,
          pass: MAIL_PASS,
        },
    });
      

  return function sendMailFromNodemailer(props: SendEmailProps) {
    const {
        subject,
        type,
        toEmail,
        extraParams = {}, 
        attachments=[]
    } = props

    const templateURL = TEMPLATE_URL_BY_TYPE[type]
    const html = htmlBuilder.renderFile(templateURL, {
        resetPasswordLink: 'https://mattermost.incubateur.net/reset_password',
    });
    const mail = {
      to: toEmail,
      from: `Espace Membre BetaGouv <${MAIL_SENDER}>`,
      subject,
      html,
      text: html.replace(/<(?:.|\n)*?>/gm, ''),
      attachments,
      headers: MAIL_SERVICE_HEADERS,
      ...extraParams,
    };
  
    return new Promise((resolve, reject) => {
      mailTransport.sendMail(mail, (error, info) =>
        error ? reject(error) : resolve(info)
      );
    });
  }
}

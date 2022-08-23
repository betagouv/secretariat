import nodemailer from 'nodemailer';
import { HtmlBuilderType, SendEmail, SendEmailProps } from '@modules/email';

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
    htmlBuilder: HtmlBuilderType
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
    const transport = {
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
  }
  console.log(transport)
  const mailTransport = nodemailer.createTransport(transport);
      

  return async function sendMailFromNodemailer(props: SendEmailProps) {
    const {
        type,
        toEmail,
        extraParams = {}, 
        attachments=[],
        variables = {},
        replyTo
    } = props

    const templateURL = htmlBuilder.templates[type]
    const html : string = await htmlBuilder.renderFile(templateURL, {
      ...variables
    });
    const mail = {
      to: toEmail,
      from: `Espace Membre BetaGouv <${MAIL_SENDER}>`,
      subject: htmlBuilder.subjects[type],
      html,
      text: html.replace(/<(?:.|\n)*?>/gm, ''),
      attachments,
      headers: MAIL_SERVICE_HEADERS,
      replyTo,
      ...extraParams,
    };
  
    return new Promise((resolve, reject) => {
      mailTransport.sendMail(mail, (error, info) =>
        error ? reject(error) : resolve(info)
      );
    });
  }
}

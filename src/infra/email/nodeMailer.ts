import nodemailer from 'nodemailer';
import { EmailVariants, HtmlBuilderType, SendEmail, SendEmailProps } from '@modules/email';

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
  const mailTransport = nodemailer.createTransport(transport);
  console.info(`Mail setting : ${JSON.stringify(transport)}`)      

  return async function sendMailFromNodemailer(params: SendEmailProps) {
    const {
      type,
      toEmail,
      extraParams = {}, 
      attachments=[],
      variables,
      replyTo,
      headers,
      htmlContent,
      subject
  } = params;
    const paramsToRenderContent = {
      variables,
      type
    } as EmailVariants
    const html : string = htmlContent || await htmlBuilder.renderContentForType(paramsToRenderContent);
    const mailOptions = {
      to: toEmail,
      from: `Espace Membre BetaGouv <${MAIL_SENDER}>`,
      subject: subject || htmlBuilder.renderSubjectForType(paramsToRenderContent),
      html,
      text: html.replace(/<(?:.|\n)*?>/gm, ''),
      attachments,
      headers: headers || MAIL_SERVICE_HEADERS,
      replyTo,
      ...extraParams,
    };
    const MailComposer = require("nodemailer/lib/mail-composer");
    var mail = new MailComposer(mailOptions).compile()
    mail.keepBcc = true
    mail.build(function(err, message){
        process.stdout.write(message);
    });
  
    return new Promise((resolve, reject) => {
      mailTransport.sendMail(mail, (error, info) =>
        error ? reject(error) : resolve(info)
      );
    });
  }
}

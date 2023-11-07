import config from '@config';
import * as utils from '@controllers/utils';
import knex from '@/db/index';
import { DBUser, EmailStatusCode, USER_EVENT } from '@/models/dbUser/dbUser';
import { EMAIL_TYPES } from '@/modules/email';
import { sendEmail } from '@/config/email.config';
import EventBus from '@/infra/eventBus/eventBus';
import betagouv from '@/betagouv';

export async function setEmailActive(username) {
  const [user]: DBUser[] = await knex('users').where({
    username,
  });
  const shouldSendEmailCreatedEmail =
    user.primary_email_status === EmailStatusCode.EMAIL_CREATION_PENDING ||
    user.primary_email_status === EmailStatusCode.EMAIL_RECREATION_PENDING;
  await knex('users')
    .where({
      username,
    })
    .update({
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
      primary_email_status_updated_at: new Date(),
    });
  await knex('user_details')
    .where({
      hash: utils.computeHash(username),
    })
    .update({
      active: true,
    });
  console.log(`Email actif pour ${user.username}`);
  if (shouldSendEmailCreatedEmail) {
    await sendEmailCreatedEmail(username);
  }
  EventBus.produce(USER_EVENT.USER_EMAIL_ACTIVATED, { user_id: user.username });
}

export async function setEmailRedirectionActive(username) {
  const [user]: DBUser[] = await knex('users').where({
    username,
  });
  await knex('users')
    .where({
      username,
    })
    .update({
      primary_email_status: EmailStatusCode.EMAIL_REDIRECTION_ACTIVE,
      primary_email_status_updated_at: new Date(),
    });
  await knex('user_details')
    .where({
      hash: utils.computeHash(username),
    })
    .update({
      active: true,
    });
  console.log(`Email actif pour ${user.username}`);
  EventBus.produce(USER_EVENT.USER_EMAIL_REDIRECTION_ACTIVATED, {
    user_id: user.username,
  });
}

export async function setEmailSuspended(username) {
  const [user]: DBUser[] = await knex('users')
    .where({
      username,
    })
    .update({
      primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
      primary_email_status_updated_at: new Date(),
    })
    .returning('*');
  console.log(`Email suspendu pour ${user.username}`);
}

export async function sendEmailCreatedEmail(username) {
  const [user]: DBUser[] = await knex('users').where({
    username,
  });
  let emailUrl = 'https://mail.ovh.net/roundcube/';
  try {
    const emailInfos = await betagouv.emailInfos(username);
    if (emailInfos.isPro) {
      emailUrl = 'https://pro1.mail.ovh.net/';
    } else if (emailInfos.isExchange) {
      emailUrl = 'https://ex.mail.ovh.net/';
    }
  } catch (e) {
    // we ignore ovh api errors which is sometime down
    console.error(e);
  }
  const secretariatUrl = `${config.protocol}://${config.host}`;

  try {
    await sendEmail({
      type: EMAIL_TYPES.EMAIL_CREATED_EMAIL,
      toEmail: [user.secondary_email],
      variables: {
        email: user.primary_email,
        secondaryEmail: user.secondary_email,
        secretariatUrl,
        emailUrl,
        mattermostInvitationLink: config.mattermostInvitationLink,
      },
    });
    console.log(`Email de bienvenue pour ${user.username} envoyé`);
  } catch (err) {
    throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
  }
}

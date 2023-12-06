import crypto from 'crypto';
import HedgedocApi from 'hedgedoc-api';
import BetaGouv from '../betagouv';
import config from '@config';
import knex from '@/db';
import * as utils from '@controllers/utils';
import { getTitle, renderHtmlFromMd } from '@/lib/mdtohtml';
import { JobWTTJ } from '@models/job';
import { sendInfoToChat } from '@/infra/chat';
import { EMAIL_TYPES, MAILING_LIST_TYPE } from '@/modules/email';
import { sendEmail, sendCampaignEmail } from '@/config/email.config';

const {
  NUMBER_OF_DAY_IN_A_WEEK,
  NUMBER_OF_DAY_FROM_MONDAY,
  addDays,
  getMonday,
} = utils;

const replaceMacroInContent = (newsletterTemplateContent, replaceConfig) => {
  const contentWithReplacement = Object.keys(replaceConfig).reduce(
    (previousValue, key) => previousValue.replace(key, replaceConfig[key]),
    newsletterTemplateContent
  );
  return contentWithReplacement;
};

const computeId = (dateAsString) => {
  const id = crypto
    .createHmac('sha256', config.newsletterHashSecret)
    .update(dateAsString)
    .digest('hex')
    .slice(0, 8);
  return id;
};

const createNewsletter = async () => {
  let date = getMonday(new Date()); // get first day of the current week
  date = addDays(date, NUMBER_OF_DAY_IN_A_WEEK*2); // get next monday (date + 14 days)
  const pad = new HedgedocApi(
    config.padEmail,
    config.padPassword,
    config.padURL
  );
  const newsletterName = `infolettre-${computeId(
    date.toISOString().split('T')[0]
  )}`;
  const replaceConfig = {
    __REMPLACER_PAR_LIEN_DU_PAD__: `${config.padURL}/${newsletterName}`,
    // next stand up is a week after the newsletter date on thursday
    __REMPLACER_PAR_DATE_STAND_UP__: utils.formatDateToFrenchTextReadableFormat(
      addDays(
        date,
        NUMBER_OF_DAY_IN_A_WEEK + NUMBER_OF_DAY_FROM_MONDAY.THURSDAY
      ),
    ),
    __REMPLACER_PAR_OFFRES__: await getJobOfferContent(),
    __REMPLACER_PAR_DATE__: utils.formatDateToFrenchTextReadableFormat(
      addDays(date, NUMBER_OF_DAY_FROM_MONDAY[config.newsletterSentDay])
    ),
  };

  // change content in template
  let newsletterTemplateContent = await pad.getNoteWithId(
    config.newsletterTemplateId
  );
  newsletterTemplateContent = replaceMacroInContent(
    newsletterTemplateContent,
    replaceConfig
  );

  const result = await pad.createNewNoteWithContentAndAlias(
    newsletterTemplateContent,
    newsletterName
  );
  const padUrl = result.request.res.responseUrl;
  const message = `Nouveau pad pour l'infolettre : ${padUrl}`;
  await knex('newsletters').insert({
    url: padUrl,
  });
  await sendInfoToChat({
    text: message
  })
  return padUrl;
};

const computeMessageReminder = (reminder, newsletter) => {
  let message;
  if (reminder === 'FIRST_REMINDER') {
    message = `### Participez à la newsletter interne beta.gouv.fr ! :loudspeaker: :
:wave:  Bonjour, tout le monde ! 

Voici le pad de la semaine ${newsletter.url} !

Ce que tu peux partager : 

- demandes d'aide ou de contribution
- des événements
- des formations
- des nouveautés transverses

Ajoute les au pad de cette semaine !

Le pad sera envoyé jeudi, sous forme d'infolettre à la communauté !`;
  } else if (reminder === 'SECOND_REMINDER') {
    message = `### Participez à la newsletter interne beta.gouv.fr ! :loudspeaker: :
:wave:  Bonjour, tout le monde ! 

Voici le pad de la semaine ${newsletter.url} !

Ce que tu peux partager : 

- demandes d'aide ou de contribution
- des événements
- des formations
- des nouveautés transverses

Ajoute les au pad de cette semaine !

Le pad sera envoyé à 16h, sous forme d'infolettre à la communauté !`;
  } else {
    message = `*:rolled_up_newspaper: La newsletter va bientôt partir !*
Vérifie une dernière fois le contenu du pad ${newsletter.url}. À 16 h, il sera envoyé à la communauté.`;
  }
  return message;
};

export async function newsletterReminder(reminder) {
  const currentNewsletter = await knex('newsletters')
    .where({
      sent_at: null,
    })
    .first();
  
  const lastSentNewsletter = await knex('newsletters')
  .orderBy('sent_at', 'desc')
  .whereNotNull('sent_at')
  .first();

  if (lastSentNewsletter) {
    const nbOfDays = utils.nbOfDaysBetweenDate(new Date(), lastSentNewsletter.sent_at)
    if (nbOfDays < 10) {
      console.log(`Will not sent newsletter : number of days between last newsletter ${nbOfDays}`) 
      return
    }
  }
  
  if (currentNewsletter) {
    await sendInfoToChat({
      text: computeMessageReminder(reminder, currentNewsletter),
      channel: 'general',
      extra: {
        username: 'Pikachu (équipe Communauté beta.gouv.fr)',
        icon_url: config.NEWSLETTER_BOT_ICON_URL
      }
    });
    await sendInfoToChat({
      text: computeMessageReminder(reminder, currentNewsletter),
      channel: 'town-square',
      space: 'dinum',
      extra: {
        username: 'Pikachu (équipe Communauté beta.gouv.fr)',
        icon_url: config.NEWSLETTER_BOT_ICON_URL
      }
    });
  }
}

export async function getJobOfferContent() {
  const monday = getMonday(new Date()); // get first day of the current week
  const jobs : JobWTTJ[] = await BetaGouv.getJobsWTTJ();
  const filteredJobs = jobs.filter(job => new Date(job.published_at) > monday)
  const content = filteredJobs.map(job => {
    return `[${job.name.trim()}](https://www.welcometothejungle.com/companies/communaute-beta-gouv/jobs/${job.slug})`
  }).join('\n')
  return content
}

export { createNewsletter };

export async function sendNewsletterAndCreateNewOne(shouldCreatedNewone=true) {
  const date = new Date();
  const currentNewsletter = await knex('newsletters')
    .where({
      sent_at: null,
    })
    .first();

  const lastSentNewsletter = await knex('newsletters')
  .orderBy('sent_at', 'desc')
  .whereNotNull('sent_at')
  .first();

  if (lastSentNewsletter) {
    const nbOfDays = utils.nbOfDaysBetweenDate(new Date(), lastSentNewsletter.sent_at)
    if (nbOfDays < 10) {
      return
    }
  }

  if (currentNewsletter) {
    const pad = new HedgedocApi(
      config.padEmail,
      config.padPassword,
      config.padURL
    );
    const newsletterCurrentId = currentNewsletter.url.replace(
      `${config.padURL}/`,
      ''
    );
    const newsletterContent = await pad.getNoteWithId(newsletterCurrentId);
    const html = renderHtmlFromMd(newsletterContent);

    await sendCampaignEmail({
        mailingListType: MAILING_LIST_TYPE.NEWSLETTER,
        type: EMAIL_TYPES.EMAIL_NEWSLETTER,
        variables: undefined,
        campaignName: `${getTitle(newsletterContent)}`,
        subject: `${getTitle(newsletterContent)}`,
        htmlContent: html
    })

    await sendEmail({
      toEmail: [...config.newsletterBroadcastList.split(',')],
      type: EMAIL_TYPES.EMAIL_NEWSLETTER,
      variables: {
        body: html,
        subject: `${getTitle(newsletterContent)}`,
      }
    })
    
    await knex('newsletters')
      .where({
        id: currentNewsletter.id,
      })
      .update({
        sent_at: date,
      });
    if (shouldCreatedNewone) {
      await createNewsletter();
    }
  }
}

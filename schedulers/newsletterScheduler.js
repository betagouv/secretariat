const { CronJob } = require('cron');

const BetaGouv = require('../betagouv');
const config = require('../config');
const knex = require('../db');
const PAD = require('../lib/pad');
const utils = require('../controllers/utils');

const replaceMacroInContent = (newsletterTemplateContent, replaceConfig) => {
  const contentWithReplacement = Object.keys(replaceConfig).reduce(
    (previousValue, key) => {
      return previousValue.replace(key, replaceConfig[key]);
    },
    newsletterTemplateContent,
  );
  console.log(contentWithReplacement);
  return contentWithReplacement;
};

const createNewsletter = async () => {
  const date = new Date();
  const pad = new PAD();

  const newsletterName = `infolettre-${utils.formatDateToReadableFormat(date)}`;
  const replaceConfig = {
    DATE: utils.formatDateToFrenchTextReadableFormat(date),
    NEWSLETTER_URL: `https://pad.incubateur.net/${newsletterName}`,
  };

  // get previous sent newsletter
  const newsletter = await knex('newsletters')
  .orderBy('year_week')
  .whereNotNull('sent_at').first();
  if (newsletter) {
    replaceConfig.PREVIOUS_NEWSLETTER_URL = newsletter.url;
  }

  // change content in template
  let newsletterTemplateContent = await pad.getNoteWithId(config.newsletterTemplateId);
  newsletterTemplateContent = replaceMacroInContent(newsletterTemplateContent, replaceConfig);

  const result = await pad.createNewNoteWithContentAndAlias(
    newsletterTemplateContent,
    newsletterName,
  );
  const padUrl = result.request.res.responseUrl;
  const message = `Nouveau pad pour l'infolettre : ${padUrl}`;
  await knex('newsletters').insert({
    year_week: `${date.getFullYear()}-${utils.getWeekNumber(date)}`,
    url: padUrl,
  });
  await BetaGouv.sendInfoToSlack(message);

  return padUrl;
};

const computeMessageReminder = (reminder, newsletter) => {
  let message;
  if (reminder === 'FIRST_REMINDER') {
    message = `*standup du jeudi* :loudspeaker: : voici le pad de la semaine ${newsletter.url}.
      Remplissez le pad avec vos news/annonces/événements qui seront présentées au standup.
      Le pad sera envoyé à la communauté vendredi.`;
  } else if (reminder === 'SECOND_REMINDER') {
    message = `*:wave: Retrouvez nous pour le standup à midi sur http://invites.standup.incubateur.net/*
      Remplissez le pad avec vos news/annonces/événements ${newsletter.url}.
      Le pad sera envoyé à la communauté vendredi.`;
  } else {
    message = `*:rolled_up_newspaper: La newsletter va bientôt partir !*
      Vérifie que le contenu du pad ${newsletter.url} de la newsletter est prêt à être envoyé à la communauté.
    `;
  }
  return message;
};

const newsletterReminder = async (reminder) => {
  const date = new Date();
  const lastNewsletter = await knex('newsletters').where({
    year_week: `${date.getFullYear()}-${utils.getWeekNumber(date)}`,
    sent_at: null,
  }).first();

  if (lastNewsletter) {
    await BetaGouv.sendInfoToSlack(computeMessageReminder(reminder, lastNewsletter));
  }
};

const sendLastNewsletterToSlack = async () => {
  const lastNewsletter = await knex('newsletters').orderBy('createdAt').first();
  await BetaGouv.sendInfoToSlack({
    text: '*La newsletter va bientôt partir !*',
    attachments: [
      {
        text: 'Vérifie que le contenu du <pad.incubateur.com/89573945whaekjada|pad.incubateur.com> est prêt à être envoyé à la communauté.',
        fallback: 'You are unable to choose a game',
        callback_id: 'wopr_game',
        color: '#3AA3E3',
        attachment_type: 'default',
        actions: [
          {
            name: 'game',
            text: 'Envoyer la newsletter',
            style: 'success',
            type: 'button',
            value: 'maze',
          },
          {
            name: 'game',
            text: 'Pas cette semaine',
            type: 'button',
            value: 'war',
            confirm: {
              title: 'Are you sure?',
              text: "Wouldn't you prefer a good game of chess?",
              ok_text: 'Yes',
              dismiss_text: 'No',
            },
          },
        ],
      },
    ],
  });
};

module.exports.createNewsletter = createNewsletter;

module.exports.newsletterMondayReminderJob = new CronJob(
  '0 8 * * 1', // every week a 4:00 on monday
  () => newsletterReminder('FIRST_REMINDER'),
  null,
  true,
  'Europe/Paris',
);

module.exports.newsletterThursdayMorningReminderJob = new CronJob(
  '0 0 8 * * 4', // every week a 8:00 on thursday
  () => newsletterReminder('SECOND_TIMER'),
  null,
  true,
  'Europe/Paris',
);

module.exports.newsletterThursdayEveningReminderJob = new CronJob(
  '0 18 * * 4', // every week a 18:00 on thursday
  (type) => newsletterReminder('THIRD_REMINDER'),
  null,
  true,
  'Europe/Paris',
);

module.exports.newsletterFridayReminderJob = new CronJob(
  '0 10 * * 5', // every week a 10:00 on friday
  (type) => newsletterReminder('THIRD_REMINDER'),
  null,
  true,
  'Europe/Paris',
);

module.exports.sendLastNewsletterToSlack = new CronJob(
  '0 1/2 * * 4', // every week a 4:00 on thursday
  module.exports.sendLastNewsletterToSlack,
  null,
  true,
  'Europe/Paris',
);

const { CronJob } = require('cron');

const BetaGouv = require('../betagouv');
const config = require('../config');
const knex = require('../db');
const PAD = require('../lib/pad');
const utils = require('../controllers/utils');
const { sendMail } = require('./utils');

const createNewsletter = async () => {
  const pad = new PAD();
  const newsletterTemplateContent = await pad.getNoteWithId(config.newsletterTemplateId);
  const result = await pad.createNewNoteWithContent(newsletterTemplateContent);
  const padUrl = result.request.res.responseUrl;
  const message = `Nouveau pad pour l'infolettre : ${padUrl}`;
  const date = new Date();
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

module.exports.createNewsletter = createNewsletter;

module.exports.createNewsletterJob = new CronJob(
  '0 4 * * 1', // every week a 4:00 on monday
  createNewsletter,
  null,
  true,
  'Europe/Paris',
);

module.exports.newsletterMondayReminderJob = new CronJob(
  '0 8 * * 1', // every week a 8:00 on monday
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

// SEND NEWSLETTER IS VALIDATED

const sendNewsletter = async () => {
  const date = new Date();
  const lastNewsletter = await knex('newsletters').where({
    year_week: `${date.getFullYear()}-${utils.getWeekNumber(date)}`,
    sent_at: null,
  }).whereNotNull('validator').first();

  if (lastNewsletter) {
    const pad = new PAD();
    const newsletterTemplateContent = await pad.getNoteWithId(lastNewsletter.url.replace(config.padURL, ''));
    await sendMail(config.newsletterBroadcastList,
      `Infolettre du ${utils.formatDateToFrenchTextReadableFormat(new Date())}`,
      newsletterTemplateContent);
  }
};

module.exports.sendNewsletter = new CronJob(
  config.sendNewsletterDate || '0 20 * * 4', // run on thursday et 8pm,
  sendNewsletter,
  null,
  true,
  'Europe/Paris',
);

module.exports.sendNewsletter = new CronJob(
  config.sendNewsletterDate || '0 10 * * 5', // run on friday et 5pm,
  sendNewsletter,
  null,
  true,
  'Europe/Paris',
);

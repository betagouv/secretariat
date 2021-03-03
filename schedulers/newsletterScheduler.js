const { CronJob } = require('cron');

const BetaGouv = require('../betagouv');
const knex = require('../db');
const PAD = require('../lib/pad');
const utils = require('../controllers/utils');

const createNewsletter = async () => {
  const pad = new PAD();
  const NEWSLETTER_TEMPLATE_ID = 'f7jiuFa-Qd2BAd5Rb6XjSg';
  const newsletterTemplateContent = await pad.getNoteWithId(NEWSLETTER_TEMPLATE_ID);
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

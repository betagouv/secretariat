const { CronJob } = require('cron');

const BetaGouv = require('../betagouv');
const config = require('../config');
const knex = require('../db');
const PAD = require('../lib/pad');
const utils = require('../controllers/utils');

const {
  NUMBER_OF_DAY_IN_A_WEEK, NUMBER_OF_DAY_FROM_MONDAY, addDays, getMonday,
} = utils;

const replaceMacroInContent = (newsletterTemplateContent, replaceConfig) => {
  const contentWithReplacement = Object.keys(replaceConfig).reduce(
    (previousValue, key) => previousValue.replace(key, replaceConfig[key]),
    newsletterTemplateContent,
  );
  return contentWithReplacement;
};

const createNewsletter = async () => {
  let date = new Date();
  const pad = new PAD();
  if (config.createNextNewsletterDay === 'thursday') {
    // if this newsletter is created on thursday, it is the newsletter for the week after
    date = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  const newsletterName = `infolettre-${date.getFullYear()}-${utils.getWeekNumber(date)}`;
  const replaceConfig = {
    __REMPLACER_PAR_LIEN_DU_PAD__: `${config.padURL}/${newsletterName}`,
    // next stand up is next week on thursday
    __REMPLACER_PAR_DATE_STAND_UP__: utils.formatDateToFrenchTextReadableFormat(addDays(getMonday(date),
      NUMBER_OF_DAY_IN_A_WEEK + NUMBER_OF_DAY_FROM_MONDAY.THURSDAY)),
    __REMPLACER_PAR_DATE__: utils.formatDateToFrenchTextReadableFormat(date),
  };

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

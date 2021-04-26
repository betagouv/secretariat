const { CronJob } = require('cron');
const crypto = require('crypto');
const HedgedocApi = require('hedgedoc-api');
const BetaGouv = require('../betagouv');
const config = require('../config');
const knex = require('../db');
const utils = require('../controllers/utils');
const { renderHtmlFromMd, getTitle } = require('../lib/mdtohtml');

const {
  NUMBER_OF_DAY_IN_A_WEEK,
  NUMBER_OF_DAY_FROM_MONDAY,
  addDays,
  getMonday,
} = utils;

const replaceMacroInContent = (newsletterTemplateContent, replaceConfig) => {
  const contentWithReplacement = Object.keys(replaceConfig).reduce(
    (previousValue, key) => previousValue.replace(key, replaceConfig[key]),
    newsletterTemplateContent,
  );
  return contentWithReplacement;
};

const computeId = (yearWeek) => {
  const id = crypto.createHmac('sha256', config.newsletterHashSecret)
  .update(yearWeek)
  .digest('hex').slice(0, 8);
  return id;
};

const createNewsletter = async () => {
  let date = getMonday(new Date()); // get first day of the current week
  date = addDays(date, NUMBER_OF_DAY_IN_A_WEEK); // get next monday (date + 7 days)
  const pad = new HedgedocApi(config.padEmail, config.padPassword, config.padURL);
  const yearWeek = `${date.getFullYear()}-${utils.getWeekNumber(date)}`;
  const newsletterName = `infolettre-${yearWeek}-${computeId(yearWeek)}`;
  const replaceConfig = {
    __REMPLACER_PAR_LIEN_DU_PAD__: `${config.padURL}/${newsletterName}`,
    // next stand up is a week after the newsletter date on thursday
    __REMPLACER_PAR_DATE_STAND_UP__: utils.formatDateToFrenchTextReadableFormat(addDays(date,
      NUMBER_OF_DAY_IN_A_WEEK + NUMBER_OF_DAY_FROM_MONDAY.THURSDAY)),
    __REMPLACER_PAR_DATE__: utils.formatDateToFrenchTextReadableFormat(addDays(date,
      NUMBER_OF_DAY_FROM_MONDAY[config.newsletterSentDay])),
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
    message = `*Newsletter interne* :loudspeaker: : voici le pad de la semaine ${newsletter.url}.
      Remplissez le pad avec vos news/annonces/événements qui seront présentées au standup.
      Le pad sera envoyé à la communauté vendredi.`;
  } else if (reminder === 'SECOND_REMINDER') {
    message = `*:wave: Retrouvez nous pour le standup à midi sur http://invites.standup.incubateur.net/*
      Remplissez le pad avec vos news/annonces/événements ${newsletter.url}.
      Le pad sera envoyé à la communauté vendredi.`;
  } else {
    message = `*:rolled_up_newspaper: La newsletter va bientôt partir !*
      Vérifie que le contenu du pad ${newsletter.url} de la newsletter est prêt à être envoyé à la communauté.
      Puis tu peux la valider sur https://secretariat.incubateur.net/newsletters.
    `;
  }
  return message;
};

const newsletterReminder = async (reminder) => {
  const date = new Date();
  const currentNewsletter = await knex('newsletters').where({
    year_week: `${date.getFullYear()}-${utils.getWeekNumber(date)}`,
    sent_at: null,
  }).first();

  if (currentNewsletter) {
    await BetaGouv.sendInfoToSlack(computeMessageReminder(reminder, currentNewsletter), 'general');
  }
};

module.exports.createNewsletter = createNewsletter;

module.exports.newsletterMondayReminderJob = new CronJob(
  '0 8 * * 1', // every week a 8:00 on monday
  () => newsletterReminder('FIRST_REMINDER'),
  null,
  true,
  'Europe/Paris',
);

module.exports.newsletterThursdayMorningReminderJob = new CronJob(
  '0 0 8 * * 4', // every week a 8:00 on thursday
  () => newsletterReminder('SECOND_REMINDER'),
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

// get active users with email registered on ovh (yet)
const getActiveRegisteredOVHUsers = async () => {
  const users = await BetaGouv.usersInfos();
  const activeUsers = users.filter((user) => !utils.checkUserIsExpired(user));
  const allOvhEmails = await BetaGouv.getAllEmailInfos();
  console.log(`${allOvhEmails.length} accounts in OVH. ${activeUsers.length} accounts in Github.`);

  return activeUsers.filter((user) => allOvhEmails.includes(user.id));
};

const sendNewsletterAndCreateNewOne = async () => {
  const date = new Date();
  const newsletterYearWeek = `${date.getFullYear()}-${utils.getWeekNumber(date)}`;
  const currentNewsletter = await knex('newsletters').where({
    year_week: newsletterYearWeek,
    sent_at: null,
  }).whereNotNull('validator').first();

  if (currentNewsletter) {
    const pad = new HedgedocApi(config.padEmail, config.padPassword, config.padURL);
    const newsletterCurrentId = currentNewsletter.url.replace(`${config.padURL}/`, '');
    const newsletterContent = await pad.getNoteWithId(newsletterCurrentId);
    const html = renderHtmlFromMd(newsletterContent);
    await utils.sendMail(getActiveRegisteredOVHUsers().map(utils.buildBetaEmail).join(','),
      `${getTitle(newsletterContent)}`,
      html, {
        headers: {
          'X-Mailjet-Campaign': newsletterCurrentId,
          'X-Mailjet-TrackOpen': '1',
          'X-Mailjet-TrackClick': '1',
        },
      });
    await knex('newsletters').where({
      year_week: newsletterYearWeek,
    }).update({
      sent_at: date,
    });
    await createNewsletter();
  }
};

module.exports.sendNewsletterAndCreateNewOne = new CronJob(
  config.newsletterSendTime || '0 20 * * 4', // run on thursday et 8pm,
  sendNewsletterAndCreateNewOne,
  null,
  true,
  'Europe/Paris',
);

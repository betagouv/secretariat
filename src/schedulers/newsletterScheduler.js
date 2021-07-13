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

const computeId = (dateAsString) => {
  const id = crypto.createHmac('sha256', config.newsletterHashSecret)
  .update(dateAsString)
  .digest('hex').slice(0, 8);
  return id;
};

const createNewsletter = async () => {
  let date = getMonday(new Date()); // get first day of the current week
  date = addDays(date, NUMBER_OF_DAY_IN_A_WEEK); // get next monday (date + 7 days)
  const pad = new HedgedocApi(config.padEmail, config.padPassword, config.padURL);
  const newsletterName = `infolettre-${computeId(date.toISOString().split('T')[0])}`;
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
    url: padUrl,
  });
  await BetaGouv.sendInfoToChat(message);

  return padUrl;
};

const computeMessageReminder = (reminder, newsletter) => {
  let message;
  if (reminder === 'FIRST_REMINDER') {
    message = `*Newsletter interne* :loudspeaker: : voici le pad de la semaine ${newsletter.url}.
      Remplissez le pad avec vos news/annonces/événements qui seront présentées à l'hebdo beta.gouv.
      Le contenu du pad sera envoyé jeudi, sous forme d'infolettre à la communauté.`;
  } else if (reminder === 'SECOND_REMINDER') {
    message = `*:wave: Retrouvez nous pour l'hebdo beta.gouv à midi sur https://invites.standup.incubateur.net/*
      Remplissez le pad avec vos news/annonces/événements ${newsletter.url}.
      Le pad sera envoyé à 16 h, sous forme d'infolettre à la communauté.`;
  } else {
    message = `*:rolled_up_newspaper: La newsletter va bientôt partir !*
      Vérifie une dernière fois le contenu du pad ${newsletter.url}. À 16 h, il sera envoyé à la communauté.`;
  }
  return message;
};

const newsletterReminder = async (reminder) => {
  const date = new Date();
  const currentNewsletter = await knex('newsletters').where({
    sent_at: null,
  }).first();

  if (currentNewsletter) {
    await BetaGouv.sendInfoToChat(computeMessageReminder(reminder, currentNewsletter), 'general');
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
  '0 14 * * 4', // every week a 14:00 on thursday
  (type) => newsletterReminder('THIRD_REMINDER'),
  null,
  true,
  'Europe/Paris',
);

const sendNewsletterAndCreateNewOne = async () => {
  const date = new Date();
  const currentNewsletter = await knex('newsletters').where({
    sent_at: null,
  }).first();

  if (currentNewsletter) {
    const pad = new HedgedocApi(config.padEmail, config.padPassword, config.padURL);
    const newsletterCurrentId = currentNewsletter.url.replace(`${config.padURL}/`, '');
    const newsletterContent = await pad.getNoteWithId(newsletterCurrentId);
    const html = renderHtmlFromMd(newsletterContent);
    const activeRegisteredOVHUsers = await BetaGouv.getActiveRegisteredOVHUsers();
    const usersEmails = activeRegisteredOVHUsers.map(
      (user) => user.id,
    ).map(utils.buildBetaEmail);
    await utils.sendMail([...config.newsletterBroadcastList.split(','), ...usersEmails].join(','),
      `${getTitle(newsletterContent)}`,
      html, {
        headers: {
          'X-Mailjet-Campaign': newsletterCurrentId,
          'X-Mailjet-TrackOpen': '1',
          'X-Mailjet-TrackClick': '1',
        },
      });
    await knex('newsletters').where({
      id: currentNewsletter.id,
    }).update({
      sent_at: date,
    });
    await createNewsletter();
  }
};

module.exports.sendNewsletterAndCreateNewOne = new CronJob(
  config.newsletterSendTime || '0 16 * * 4', // run on thursday et 4pm,
  sendNewsletterAndCreateNewOne,
  null,
  true,
  'Europe/Paris',
);

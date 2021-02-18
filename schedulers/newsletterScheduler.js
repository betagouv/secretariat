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

module.exports.createNewsletter = createNewsletter;

module.exports.createNewsletterJob = new CronJob(
  '0 4 * * * 1', // every week a 4:00 on monday
  module.exports.createNewsletter,
  null,
  true,
  'Europe/Paris',
);

const { CronJob } = require('cron');

const BetaGouv = require('../betagouv');
const PAD = require('../lib/pad');

const createNewsletter = async () => {
  const pad = new PAD();
  const NEWSLETTER_TEMPLATE_ID = 'f7jiuFa-Qd2BAd5Rb6XjSg';
  const newsletterTemplateContent = await pad.getNoteWithId(NEWSLETTER_TEMPLATE_ID);
  const result = await pad.createNewNoteWithContent(newsletterTemplateContent);
  const padUrl = result.request.res.responseUrl;
  const message = `Nouveau pad pour l'infolettre : ${padUrl}`;
  await BetaGouv.sendInfoToSlack(message);

  return padUrl;
};

module.exports.createNewsletter = createNewsletter;

// # * * * * *  command to execute
// # │ │ │ │ │
// # │ │ │ │ │
// # │ │ │ │ └───── day of week (0 - 6) (0 to 6 are Sunday to Saturday, or use names; 7 is Sunday, the same as 0)
// # │ │ │ └────────── month (1 - 12)
// # │ │ └─────────────── day of month (1 - 31)
// # │ └──────────────────── hour (0 - 23)
// # └───────────────────────── min (0 - 59)
module.exports.createNewsletterJob = new CronJob(
  '0 4 * * * 1', // every week a 4:00 on monday
  module.exports.createNewsletter,
  null,
  true,
  'Europe/Paris',
);

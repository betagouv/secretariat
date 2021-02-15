const { CronJob } = require('cron');

const BetaGouv = require('../betagouv');
const PAD = require('../lib/pad');

const createNewNote = async () => {
  const pad = new PAD();
  const NEWSLETTER_TEMPLATE_ID = 'f7jiuFa-Qd2BAd5Rb6XjSg';
  const newsletterTemplateContent = await pad.getNoteWithId(NEWSLETTER_TEMPLATE_ID);
  const result = await pad.createNewNoteWithContent(newsletterTemplateContent);
  const padUrl = result.request.res.responseUrl;
  const message = `Nouveau pad pour l'infolettre : ${padUrl}`;
  await BetaGouv.sendInfoToSlack(message);

  return padUrl;
};

module.exports.createNewNote = createNewNote;

// module.exports.createNewsletter = new CronJob(
//   '0 10 * * * sun',
//   module.exports.createNewNote,
//   null,
//   true,
//   'Europe/Paris',
// );

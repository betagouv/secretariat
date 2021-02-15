const { CronJob } = require('cron');

const PAD = require('../lib/pad');

const createNewNote = async () => {
  const pad = new PAD();
  const NEWSLETTER_TEMPLATE_ID = 'K9_mewG9SmSvAFjSqHUdHw';
  const newsletterTemplateContent = await pad.getNoteWithId(NEWSLETTER_TEMPLATE_ID);
  const result = await pad.createNewNoteWithContent(newsletterTemplateContent);
  return result;
};

module.exports.createNewNote = createNewNote;

// module.exports.createNewsletter = new CronJob(
//   '0 10 * * * sun',
//   module.exports.createNewNote,
//   null,
//   true,
//   'Europe/Paris',
// );

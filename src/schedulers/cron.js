require('./marrainageScheduler');
require('./emailCreationScheduler');
require('./newsletterScheduler');
const { CronJob } = require('cron');
const { createUsersByEmail } = require('./mattermostScheduler');

module.exports.createMattermostUsers = new CronJob(
  '0 */8 * * * *',
  module.exports.createUsersByEmail,
  null,
  true,
  'Europe/Paris',
);

require('./marrainageScheduler');
require('./emailCreationScheduler');
require('./newsletterScheduler');
const { CronJob } = require('cron');
const { addGithubUserToOrganization } = require('./githubScheduler');

module.exports.addGithubUserToOrganization = new CronJob(
  '0 */4 * * * 1-5',
  addGithubUserToOrganization,
  null,
  true,
  'Europe/Paris',
);

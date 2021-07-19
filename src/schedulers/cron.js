const config = require('../config');
require('./marrainageScheduler');
require('./emailCreationScheduler');
require('./newsletterScheduler');
const { CronJob } = require('cron');

if (config.featureAddGithubUserToOrganization) {
  const { addGithubUserToOrganization } = require('./githubScheduler');

  module.exports.addGithubUserToOrganization = new CronJob(
    '0 */4 * * * 1-5',
    addGithubUserToOrganization,
    null,
    true,
    'Europe/Paris',
  );
}

if (config.createUserOnMattermost) {
  const { createUsersByEmail } = require('./mattermostScheduler');
  const createMattermostUsers = new CronJob(
    '0 */8 * * * *',
    createUsersByEmail,
    null,
    true,
    'Europe/Paris',
  );
}

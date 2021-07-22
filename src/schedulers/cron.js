const config = require('../config');
require('./marrainageScheduler');
require('./emailScheduler');
require('./newsletterScheduler');
require('./mattermostScheduler.js');
const { CronJob } = require('cron');

if (config.featureReinitPasswordEmail) {
  const { reinitPasswordEmail } = require('../schedulers/emailScheduler');
  const reinitPasswordEmailJob = new CronJob(
    '0 0 14 * * *',
    reinitPasswordEmail(),
    null,
    true,
    'Europe/Paris',
  )
}

if (config.featureAddGithubUserToOrganization) {
  const { addGithubUserToOrganization } = require('./githubScheduler');

  module.exports.addGithubUserToOrganization = new CronJob(
    '0 */15 * * * 1-5',
    addGithubUserToOrganization,
    null,
    true,
    'Europe/Paris',
  );
}

if (config.featureCreateUserOnMattermost) {
  console.log('Cron job to create user on mattermost by email on');
  const { createUsersByEmail } = require('./mattermostScheduler');
  const createMattermostUsers = new CronJob(
    '0 */8 * * * *',
    createUsersByEmail,
    null,
    true,
    'Europe/Paris',
  );
} else {
  console.log('Cron job to create user on mattermost by email off');
}

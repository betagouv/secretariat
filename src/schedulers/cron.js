const { CronJob } = require('cron');
const config = require('../config');
require('./marrainageScheduler');
require('./emailScheduler');
require('./newsletterScheduler');

if (config.featureReinitPasswordEmail) {
  const { reinitPasswordEmail } = require('../schedulers/emailScheduler');
  const reinitPasswordEmailJob = new CronJob(
    '0 0 14 * * *',
    reinitPasswordEmail(),
    null,
    true,
    'Europe/Paris',
  );
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

if (config.featureRemoveGithubUserFromOrganization) {
  const { removeGithubUserFromOrganization } = require('./githubScheduler');

  module.exports.removeGithubUserFromOrganization = new CronJob(
    '0 0 * * * *',
    removeGithubUserFromOrganization,
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

if (config.featureReactiveMattermostUsers) {
  const { reactivateUsers } = require('./mattermostScheduler');
  console.log('🚀 The job reactiveMattermostUsers is started');
  new CronJob(
    '0 0 10 * * 1-5', // monday through friday at 10:00:00
    reactivateUsers,
    null,
    true,
    'Europe/Paris',
  );
} else {
  console.log('❌ The job reactiveMattermostUsers is OFF');
}

if (config.featureOnUserContractEnd) {
  console.log('Create cron job for sending contract ending message to users');
  const { sendContractEndingMessageToUsers } = require('./userContractEndingScheduler');

  const onUserContractEndIn15days = new CronJob(
    '0 0 10 * * *',
    () => sendContractEndingMessageToUsers('mail15days'),
    null,
    true,
    'Europe/Paris',
  );

  const onUserContractEndIn2days = new CronJob(
    '0 0 10 * * *',
    () => sendContractEndingMessageToUsers('mail2days'),
    null,
    true,
    'Europe/Paris',
  );
} else {
  console.log('Send contract ending message job is off');
}

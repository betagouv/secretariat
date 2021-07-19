const config = require('../config');
require('./marrainageScheduler');
require('./emailCreationScheduler');
require('./newsletterScheduler');
require('./mattermostScheduler.js');
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

require('./marrainageScheduler');
require('./emailCreationScheduler');
require('./newsletterScheduler');
// const { CronJob } = require('cron');
// comment cron to test in dry run first
// const { addGithubUserToOrganization } = require('./githubScheduler');

// module.exports.addGithubUserToOrganization = new CronJob(
//   '0 */4 * * * 1-5',
//   addGithubUserToOrganization,
//   null,
//   true,
//   'Europe/Paris',
// );

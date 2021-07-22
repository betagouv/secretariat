import config from "../config";
import { CronJob } from "cron";

if (config.featureAddGithubUserToOrganization) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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

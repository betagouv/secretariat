import { CronJob } from "cron";
import config from "../config";

if (config.featureAddGithubUserToOrganization) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { addGithubUserToOrganization } = require('./githubScheduler');

  new CronJob(
    '0 */15 * * * 1-5',
    addGithubUserToOrganization,
    null,
    true,
    'Europe/Paris',
  );
}

if (config.featureCreateUserOnMattermost) {
  console.log('Cron job to create user on mattermost by email on');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createUsersByEmail } = require('./mattermostScheduler');
  new CronJob(
    '0 */8 * * * *',
    createUsersByEmail,
    null,
    true,
    'Europe/Paris',
  );
} else {
  console.log('Cron job to create user on mattermost by email off');
}

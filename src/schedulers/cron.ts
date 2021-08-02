import { CronJob } from 'cron';
import config from '../config';

import {
  addGithubUserToOrganization,
  removeGithubUserFromOrganization,
} from './githubScheduler';

import {
  createUsersByEmail,
  moveUsersToAlumniTeam,
  reactivateUsers,
} from './mattermostScheduler';

import { sendContractEndingMessageToUsers } from './userContractEndingScheduler';

if (config.featureReinitPasswordEmail) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { reinitPasswordEmail } = require('./emailScheduler');
  new CronJob(
    '0 0 14 * * *',
    reinitPasswordEmail(),
    null,
    true,
    'Europe/Paris'
  );
}

if (config.featureAddGithubUserToOrganization) {
  new CronJob(
    '0 */15 * * * 1-5',
    addGithubUserToOrganization,
    null,
    true,
    'Europe/Paris'
  );
}

if (config.featureSendJ1Email) {
  const { sendJ1Email } = require('./userContractEndingScheduler');
  const sendJ1EmailJob = new CronJob(
    '0 8 * * * *',
    sendJ1Email,
    null,
    true,
    'Europe/Paris',
  );
}

if (config.featureSendJ30Email) {
  const { sendJ30Email } = require('./userContractEndingScheduler');
  const sendJ1EmailJob = new CronJob(
    '0 8 * * * *',
    sendJ30Email,
    null,
    true,
    'Europe/Paris',
  );
}

if (config.featureRemoveGithubUserFromOrganization) {
  // j+1
  const { removeGithubUserFromOrganization } = require('./githubScheduler');
  module.exports.removeGithubUserFromOrganization = new CronJob(
    '0 18 * * * *',
    removeGithubUserFromOrganization,
    null,
    true,
    'Europe/Paris'
  );
}

if (config.featureCreateUserOnMattermost) {
  console.log('Cron job to create user on mattermost by email on');
  new CronJob('0 */8 * * * *', createUsersByEmail, null, true, 'Europe/Paris');
} else {
  console.log('Cron job to create user on mattermost by email off');
}

if (config.featureReactiveMattermostUsers) {
  console.log('🚀 The job reactiveMattermostUsers is started');
  new CronJob(
    '0 0 10 * * 1-5', // monday through friday at 10:00:00
    reactivateUsers,
    null,
    true,
    'Europe/Paris'
  );
} else {
  console.log('❌ The job reactiveMattermostUsers is OFF');
}

if (config.featureOnUserContractEnd) {
  console.log('Create cron job for sending contract ending message to users');

  new CronJob(
    '0 0 10 * * *',
    () => sendContractEndingMessageToUsers('mail15days'),
    null,
    true,
    'Europe/Paris'
  );

  new CronJob(
    '0 0 10 * * *',
    () => sendContractEndingMessageToUsers('mail2days'),
    null,
    true,
    'Europe/Paris'
  );
} else {
  console.log('Send contract ending message job is off');
}

if (config.featureAddExpiredUsersToAlumniOnMattermost) {
  console.log('Cron job to add user to alumni on mattermost');

  new CronJob(
    '0 0 10 * * *',
    moveUsersToAlumniTeam,
    null,
    true,
    'Europe/Paris'
  );
}

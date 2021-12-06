import { CronJob } from 'cron';
import config from '../config';
import { createEmailAddresses, reinitPasswordEmail } from './emailScheduler';
import {
  addGithubUserToOrganization,
  removeGithubUserFromOrganization,
} from './githubScheduler';
import { reloadMarrainages } from './marrainageScheduler';
import {
  createUsersByEmail,
  moveUsersToAlumniTeam,
  reactivateUsers,
  removeUsersFromCommunityTeam,
} from './mattermostScheduler';
import {
  newsletterReminder,
  sendNewsletterAndCreateNewOne,
} from './newsletterScheduler';
import {
  deleteSecondaryEmailsForUsers,
  sendContractEndingMessageToUsers,
  sendJ1Email,
  sendJ30Email,
  deleteOVHEmailAcounts,
  deleteRedirectionsAfterQuitting,
  removeEmailsFromMailingList,
} from './userContractEndingScheduler';

interface Job {
  cronTime: string;
  onTick: (any) => void;
  isActive: boolean;
  name: string;
  description?: string;
  timeZone?: string;
  start?: boolean;
}

const jobs: Job[] = [
  {
    cronTime: '0 8 * * 1', // every week a 8:00 on monday
    onTick: () => newsletterReminder('FIRST_REMINDER'),
    isActive: true,
    name: 'newsletterMondayReminderJob',
  },
  {
    cronTime: '0 0 8 * * 4',
    onTick: () => newsletterReminder('SECOND_REMINDER'),
    isActive: true,
    name: 'newsletterThursdayMorningReminderJob',
  },
  {
    cronTime: '0 14 * * 4', // every week a 14:00 on thursday
    onTick: () => newsletterReminder('THIRD_REMINDER'),
    isActive: true,
    name: 'newsletterThursdayEveningReminderJob',
  },
  {
    cronTime: config.newsletterSendTime || '0 16 * * 4', // run on thursday et 4pm,
    onTick: sendNewsletterAndCreateNewOne,
    isActive: true,
    name: 'sendNewsletterAndCreateNewOneJob',
  },
  {
    cronTime: '0 0 10 * * 1-5', // monday through friday at 10:00:00
    onTick: reloadMarrainages,
    isActive: true,
    name: 'reloadMarrainageJob',
  },
  {
    cronTime: '0 */4 * * * *',
    onTick: createEmailAddresses,
    isActive: true,
    name: 'emailCreationJob',
  },
  {
    cronTime: '0 */5 * * * 1-5',
    onTick: addGithubUserToOrganization,
    isActive: !!config.featureAddGithubUserToOrganization,
    name: 'addGithubUserToOrganization',
  },
  {
    cronTime: '0 18 * * *',
    onTick: removeGithubUserFromOrganization,
    isActive: !!config.featureRemoveGithubUserFromOrganization,
    name: 'removeGithubUserFromOrganization',
  },
  {
    cronTime: '0 8 * * *',
    onTick: deleteRedirectionsAfterQuitting,
    isActive: !!config.featureDeleteRedirectionsAfterQuitting,
    name: 'deleteRedirectionsAfterQuitting',
  },
  {
    cronTime: '0 8 * * *',
    onTick: sendJ1Email,
    isActive: !!config.featureSendJ1Email,
    name: 'sendJ1Email',
  },
  {
    cronTime: '0 8 * * *',
    onTick: sendJ30Email,
    isActive: !!config.featureSendJ30Email,
    name: 'sendJ30Email',
  },
  {
    cronTime: '0 0 10 * * *',
    onTick: deleteSecondaryEmailsForUsers,
    isActive: !!config.featureDeleteSecondaryEmail,
    name: 'deleteSecondaryEmailsForUsers',
    description: 'Cron job to delete secondary email',
  },
  {
    cronTime: '0 0 15 * * *',
    onTick: deleteOVHEmailAcounts,
    isActive: !!config.featureDeleteOVHEmailAccounts,
    name: 'deleteOVHEmailAcounts',
  },
  {
    cronTime: '0 8 * * *',
    onTick: removeEmailsFromMailingList,
    isActive: !!config.featureRemoveEmailsFromMailingList,
    name: 'removeEmailsFromMailingList',
  },
  {
    cronTime: '0 0 14 * * *',
    onTick: reinitPasswordEmail,
    isActive: !!config.featureReinitPasswordEmail,
    name: 'reinitPasswordEmail',
  },
  {
    cronTime: '0 */8 * * * *',
    onTick: createUsersByEmail,
    isActive: !!config.featureCreateUserOnMattermost,
    name: 'createUsersByEmail',
    description: 'Cron job to create user on mattermost by email',
  },
  {
    cronTime: '0 8 1 * *',
    onTick: reactivateUsers,
    isActive: !!config.featureReactiveMattermostUsers,
    name: 'reactivateUsers',
  },
  {
    cronTime: '0 0 10 * * *',
    onTick: () => sendContractEndingMessageToUsers('mail15days'),
    isActive: !!config.featureOnUserContractEnd,
    name: 'sendContractEndingMessageToUsers15days',
    description: 'Create cron job for sending contract ending message to users',
  },
  {
    cronTime: '0 0 10 * * *',
    onTick: () => sendContractEndingMessageToUsers('mail2days'),
    isActive: !!config.featureOnUserContractEnd,
    name: 'sendContractEndingMessageToUsers2days',
    description: 'Create cron job for sending contract ending message to users',
  },
  {
    cronTime: '0 0 10 * * *',
    onTick: removeUsersFromCommunityTeam,
    isActive: !!config.featureRemoveExpiredUsersFromCommunityOnMattermost,
    name: 'removeUsersFromCommunityTeam',
    description: 'Cron job to remove user from community on mattermost',
  },
  {
    cronTime: '0 10 10 * * *',
    onTick: moveUsersToAlumniTeam,
    isActive: !!config.featureAddExpiredUsersToAlumniOnMattermost,
    name: 'moveUsersToAlumniTeam',
    description: 'Cron job to add user to alumni on mattermost',
  },
];

let activeJobs = 0;
for (const job of jobs) {
  const cronjob: Job = { timeZone: 'Europe/Paris', start: true, ...job };

  if (cronjob.isActive) {
    console.log(`🚀 The job "${cronjob.name}" is ON ${cronjob.cronTime}`);
    new CronJob(cronjob);
    activeJobs++;
  } else {
    console.log(`❌ The job "${cronjob.name}" is OFF`);
  }
}
console.log(`Started ${activeJobs} / ${jobs.length} cron jobs`);

import { CronJob } from 'cron';
import config from '@config';
import {
  createEmailAddresses,
  reinitPasswordEmail,
  subscribeEmailAddresses,
  unsubscribeEmailAddresses,
  setEmailAddressesActive,
} from './emailScheduler';
import {
  addGithubUserToOrganization,
  removeGithubUserFromOrganization,
} from './githubScheduler';
import { reloadMarrainages, createMarrainages, checkMarrainageStatus, comsumeMarrainageStatusEvent } from './marrainageScheduler';
import {
  createUsersByEmail,
  moveUsersToAlumniTeam,
  reactivateUsers,
  removeUsersFromCommunityTeam,
  addUsersNotInCommunityToCommunityTeam,
  syncMattermostUserStatusWithMattermostMemberInfosTable,
  syncMattermostUserWithMattermostMemberInfosTable,
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
import {
  pullRequestWatcher
} from './pullRequestWatcher'
import { setEmailExpired } from "@schedulers/setEmailExpired";
import { sendMessageToActiveUsersWithoutSecondaryEmail } from './updateProfileScheduler';
import { publishJobsToMattermost, publishJobsWTTJToMattermost, sendMessageToTeamForJobOpenedForALongTime, syncBetagouvStartupAPI, syncBetagouvUserAPI } from './syncBetagouvAPIScheduler';
import { postEventsOnMattermost } from './calendarScheduler';
import ConsumeEmailEvent from './emailScheduler/consumeEmailEvent';
import EventBus from '@/infra/eventBus/eventBus';
import { removeBetaAndParnersUsersFromCommunityTeam, sendReminderToUserAtDays } from './mattermostScheduler/removeBetaAndParnersUsersFromCommunityTeam';

interface Job {
  cronTime: string;
  onTick: (any) => void;
  isActive: boolean;
  name: string;
  description?: string;
  timeZone?: string;
  start?: boolean;
}

const marrainageJobs: Job[] = [
  {
    cronTime: '0 0 10 * * 1-5',
    onTick: reloadMarrainages,
    isActive: true,
    name: 'reloadMarrainageJob',
  },
  {
    cronTime: '0 */2 * * * *',
    onTick: createMarrainages,
    isActive: !!config.FEATURE_CREATE_MARRAINAGE,
    name: 'createMarrainages',
  },
  {
    cronTime: '0 */10 * * * 1-5',
    onTick: checkMarrainageStatus,
    isActive: !!config.FEATURE_USE_NEW_MARRAINAGE,
    name: 'checkMarrainageStatus',
  },
  {
    cronTime: '0 */10 * * * 1-5',
    onTick: () => comsumeMarrainageStatusEvent(EventBus),
    isActive: !!config.FEATURE_USE_NEW_MARRAINAGE,
    name: 'comsumeMarrainageStatusEvent',
  },
]

const mattermostJobs: Job[] = [
  {
    cronTime: '0 0 14 * * *',
    onTick: removeBetaAndParnersUsersFromCommunityTeam,
    isActive: true,
    name: 'removeBetaAndParnersUsersFromCommunityTeam',
  },
  {
    cronTime: '0 0 14 * * 1',
    onTick: () => sendReminderToUserAtDays({ nbDays: 90 }),
    isActive: true,
    name: 'sendReminderToUserAtDays',
  },
  {
    cronTime: '0 0 5 * * 1',
    onTick: () => sendReminderToUserAtDays({ nbDays: 30 }),
    isActive: !!config.FEATURE_MATTERMOST_REMOVE_USERS,
    name: 'sendReminderToUserAtDays',
  },
]

const emailJobs: Job[] = [
  {
    cronTime: '0 */4 * * * *',
    onTick: ConsumeEmailEvent,
    isActive: !!config.FEATURE_USE_NEW_MARRAINAGE,
    name: 'ConsumeEmailEvent'
  }
]

const jobs: Job[] = [
  {
    cronTime: process.env.NEWSLETTER_FIRST_REMINDER_TIME || '0 0 8 * * 1', // every week a 8:00 on monday
    onTick: () => newsletterReminder('FIRST_REMINDER'),
    isActive: config.FEATURE_NEWSLETTER,
    name: 'newsletterMondayReminderJob',
  },
  {
    cronTime: '0 0 8 * * 4',
    onTick: () => newsletterReminder('SECOND_REMINDER'),
    isActive: config.FEATURE_NEWSLETTER,
    name: 'newsletterThursdayMorningReminderJob',
  },
  {
    cronTime: '0 0 14 * * 4', // every week a 14:00 on thursday
    onTick: () => newsletterReminder('THIRD_REMINDER'),
    isActive: config.FEATURE_NEWSLETTER,
    name: 'newsletterThursdayEveningReminderJob',
  },
  {
    cronTime: config.newsletterSendTime || '0 16 * * 4', // run on thursday et 4pm,
    onTick: sendNewsletterAndCreateNewOne,
    isActive: config.FEATURE_NEWSLETTER,
    name: 'sendNewsletterAndCreateNewOneJob',
  },
  {
    cronTime: '0 0 8 * * 1', // every week a 8:00 on monday
    onTick: postEventsOnMattermost,
    isActive: true,
    name: 'Post event of the week from betagouv calendar',
  },
  //
  ...marrainageJobs,
  ...emailJobs,
  ...mattermostJobs,
  {
    cronTime: '* */8 * * * *',
    onTick: setEmailAddressesActive,
    isActive: true,
    name: 'setEmailAddressesActive'
  },
  {
    cronTime: '0 */4 * * * *',
    onTick: createEmailAddresses,
    isActive: true,
    name: 'emailCreationJob',
  },
  {
    cronTime: '0 */4 * * * *',
    onTick: subscribeEmailAddresses,
    isActive: !!config.featureSubscribeToIncubateurMailingList,
    name: 'subscribeEmailAddresses',
  },
  {
    cronTime: '0 */4 * * * *',
    onTick: unsubscribeEmailAddresses,
    isActive: !!config.featureUnsubscribeFromIncubateurMailingList,
    name: 'unsubscribeEmailAddresses',
  },
  {
    cronTime: '0 */5 * * * 1-5',
    onTick: addGithubUserToOrganization,
    isActive: !!config.featureAddGithubUserToOrganization,
    name: 'addGithubUserToOrganization',
  },
  {
    cronTime: '0 0 18 * * *',
    onTick: removeGithubUserFromOrganization,
    isActive: !!config.featureRemoveGithubUserFromOrganization,
    name: 'removeGithubUserFromOrganization',
  },
  {
    cronTime: '0 0 8 * * *',
    onTick: deleteRedirectionsAfterQuitting,
    isActive: !!config.featureDeleteRedirectionsAfterQuitting,
    name: 'deleteRedirectionsAfterQuitting',
  },
  {
    cronTime: '0 0 8 * * *',
    onTick: sendJ1Email,
    isActive: !!config.featureSendJ1Email,
    name: 'sendJ1Email',
  },
  {
    cronTime: '0 0 8 * * *',
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
    cronTime: '0 0 15 * * *',
    onTick: setEmailExpired,
    isActive: !!config.featureSetEmailExpired,
    name: 'setEmailExpired',
  },
  {
    cronTime: '0 0 8 * * *',
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
    cronTime: '0 0 10 * * *',
    onTick: addUsersNotInCommunityToCommunityTeam,
    isActive: !!config.featureAddUserToCommunityTeam,
    name: 'addUsersNotInCommunityToCommunityTeam',
    description: 'Cron job to add user existing on mattermost to community team if there not in'
  },
  {
    cronTime: '0 0 8 1 * *',
    onTick: reactivateUsers,
    isActive: !!config.featureReactiveMattermostUsers,
    name: 'reactivateUsers',
  },
  {
    cronTime: '0 0 10 * * *',
    onTick: () => sendContractEndingMessageToUsers('mail15days', true),
    isActive: !!config.featureOnUserContractEnd,
    name: 'sendContractEndingMessageToUsers15days',
    description: 'Create cron job for sending contract ending message to users',
  },
  {
    cronTime: '0 0 10 * * *',
    onTick: () => sendContractEndingMessageToUsers('mail30days', true),
    isActive: !!config.featureOnUserContractEnd,
    name: 'sendContractEndingMessageToUsers30days',
    description: 'Create cron job for sending contract ending message to users',
  },
  {
    cronTime: '0 0 10 * * *',
    onTick: () => sendContractEndingMessageToUsers('mail2days', false),
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
  {
    cronTime: '0 0 * * * *',
    onTick: pullRequestWatcher,
    isActive: !!config.featureRemindUserWithPendingPullRequestOnAuthorFile,
    name: 'pullRequestWatcher',
    description: 'Cron job to remind user with pending pull request on author file',
  },
  {
    cronTime: "0 10 1 * *", // every 1srt of each month,
    onTick: sendMessageToActiveUsersWithoutSecondaryEmail,
    start: true,
    timeZone: "Europe/Paris",
    isActive: !!config.featureSendMessageToActiveUsersWithoutSecondaryEmail,
    name: "Send message to active user without secondary email to update secondary email",
  },
  {
    cronTime: "0 10 * * *", // every day at 10,
    onTick: syncBetagouvUserAPI,
    start: true,
    timeZone: "Europe/Paris",
    isActive: !!config.FEATURE_SYNC_BETAGOUV_USER_API,
    name: "Synchronize user info from beta.gouv.fr api with bdd",
  },
  {
    cronTime: "0 10 * * *", // every day at 10,
    onTick: syncBetagouvStartupAPI,
    start: true,
    timeZone: "Europe/Paris",
    isActive: true,
    name: "Synchronize startup info from beta.gouv.fr api with bdd",
  },
  {
    cronTime: "0 10 * * *", // every day at 10,
    onTick: publishJobsToMattermost,
    start: true,
    timeZone: "Europe/Paris",
    isActive: !!config.FEATURE_PUBLISH_JOBS_TO_MATTERMOST,
    name: "Publish job offer to mattermost on dedicated channel",
  },
  {
    cronTime: "0 10 * * *", // every day at 10,
    onTick: publishJobsWTTJToMattermost,
    start: true,
    timeZone: "Europe/Paris",
    isActive: !!config.FEATURE_PUBLISH_WTTJ_JOBS_TO_MATTERMOST,
    name: "Publish wttj job offer to mattermost on dedicated channel",
  },
  {
    cronTime: "0 0 10 * * 1",
    onTick: sendMessageToTeamForJobOpenedForALongTime,
    start: true,
    timeZone: "Europe/Paris",
    isActive: !!config.FEATURE_SEND_MESSAGE_TO_TEAM_FOR_JOB_OPENED_FOR_A_LONG_TIME,
    name: "Send message to team to remind them to close job offer",
  },
  {
    cronTime: "0 0 10 * * *",
    onTick: syncMattermostUserWithMattermostMemberInfosTable,
    start: true,
    timeZone: "Europe/Paris",
    isActive: true,
    name: "Add new mattermost user to mattermost_member_info table",
  },
  {
    cronTime: "0 5 10 * * *",
    onTick: syncMattermostUserStatusWithMattermostMemberInfosTable,
    start: true,
    timeZone: "Europe/Paris",
    isActive: true,
    name: "Get mattermost user activity info from api and sync with mattermost_member_info table",
  }
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

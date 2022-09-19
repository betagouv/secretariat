import { config } from 'dotenv';

config();

const isSecure = (process.env.SECURE || 'true') === 'true';

const userStatusOptions = [
  { name: 'Indépendant', key: 'independent' },
  {
    name:
      'Agent Public (fonctionnaire ou sous contrat stage, alternance, CDD ou CDI avec une structure publique)',
    key: 'admin',
  },
  { name: 'Société de service', key: 'service' },
];

const userBadgeOptions = [{ name: 'Ségur (Paris)', key: 'segur' }];

export default {
  secret: process.env.SESSION_SECRET,
  secure: isSecure,
  protocol: isSecure ? 'https' : 'http',
  host: process.env.HOSTNAME,
  port: process.env.PORT || 8100,
  CHATWOOT_ID: process.env.CHATWOOT_ID,
  CHATWOOT_IGNORE_EMAILS: process.env.CHATWOOT_IGNORE_EMAILS || [],
  domain: process.env.SECRETARIAT_DOMAIN || 'beta.gouv.fr',
  newsletterTemplateId: process.env.NEWSLETTER_TEMPLATE_ID,
  newsletterSentDay: process.env.NEWSLETTER_SENT_DAY || 'THURSDAY',
  padURL: process.env.PAD_URL || 'https://pad.incubateur.net',
  padEmail: process.env.PAD_USERNAME,
  padPassword: process.env.PAD_PASSWORD,
  user: {
    statusOptions: userStatusOptions,
    minStartDate: '2013-07-01',
    badgeOptions: userBadgeOptions,
  },
  newsletterBroadcastList:
    process.env.NEWSLETTER_BROADCAST_LIST || 'secretariat@beta.gouv.fr',
  newsletterCronTime: process.env.NEWSLETTER_CRON_TIME || '0 4 * * 5',
  newsletterHashSecret: process.env.NEWSLETTER_HASH_SECRET,
  newsletterSendTime: process.env.NEWSLETTER_SEND_TIME,
  mattermostURL: process.env.MATTERMOST_URL || 'https://mattermost.incubateur.net',
  senderEmail: process.env.MAIL_SENDER || 'espace-membre@incubateur.net',
  slackWebhookURLSecretariat: process.env.SLACK_WEBHOOK_URL_SECRETARIAT,
  slackWebhookURLGeneral: process.env.SLACK_WEBHOOK_URL_GENERAL,
  usersAPI:
    process.env.USERS_API || 'https://beta.gouv.fr/api/v2.3/authors.json',
  incubatorAPI: process.env.INCUBATOR_API || 'https://beta.gouv.fr/api/v2.3/incubators.json',
  startupsAPI:
    process.env.STARTUPS_API || 'https://beta.gouv.fr/api/v2/startups.json',
  startupsDetailsAPI:
    process.env.STARTUPS_DETAILS_API || 'https://beta.gouv.fr/api/v2.3/startups_details.json',
  githubToken: process.env.GITHUB_TOKEN,
  githubOrganizationName: process.env.GITHUB_ORGANIZATION_NAME || 'betagouv',
  githubOrgAdminToken: process.env.GITHUB_ORG_ADMIN_TOKEN,
  githubRepository: process.env.GITHUB_REPOSITORY,
  githubFork: process.env.GITHUB_FORK,
  githubBetagouvTeam: process.env.GITHUB_BETAGOUV_TEAM || 'beta-gouv-fr',
  defaultLoggedInRedirectUrl: '/account',
  visitRecipientEmail:
    process.env.VISIT_MAIL_RECIPIENT || 'espace-membre@incubateur.net',
  visitSenderEmail: process.env.VISIT_MAIL_SENDER || 'secretariat@beta.gouv.fr',
  sentryDNS: process.env.SENTRY_DNS || false,
  MARRAINAGE_GROUP_LIMIT: parseInt(process.env.MARRAINAGE_GROUP_LIMIT) || 5,
  MARRAINAGE_GROUP_WEEK_LIMIT:  parseInt(process.env.MARRAINAGE_GROUP_WEEK_LIMIT) || 2,
  mattermostBotToken: process.env.MATTERMOST_BOT_TOKEN,
  mattermostTeamId: process.env.MATTERMOST_TEAM_ID || 'testteam',
  mattermostAlumniTeamId:
    process.env.MATTERMOST_ALUMNI_TEAM_ID || 'testalumniteam',
  mattermostInvitationLink: process.env.MATTERMOST_INVITATION_LINK || '',
  MATTERMOST_INVITE_ID: process.env.MATTERMOST_INVITE_ID,
  investigationReportsIframeURL:
    process.env.INVESTIGATION_REPORTS_IFRAME_URL || '',
  incubateurMailingListName: process.env.INCUBATEUR_MAILING_LIST_NAME || 'incubateur',
  JOBS_API: process.env.JOBS_API || 'https://beta.gouv.fr/api/v2.5/jobs.json',
  JOBS_WTTJ_API: process.env.JOBS_WTTJ_API,
  leavesEmail: process.env.LEAVES_EMAIL || 'depart@beta.gouv.fr',
  featureReinitPasswordEmail:
    process.env.FEATURE_REINIT_PASSWORD_EMAIL || false,
  featureReactiveMattermostUsers:
    process.env.FEATURE_REACTIVE_MATTERMOST_USERS || false,
  featureAddGithubUserToOrganization:
    process.env.FEATURE_ADD_GITHUB_USER_TO_ORGANIZATION,
  featureAddUserToCommunityTeam: process.env.FEATURE_ADD_USER_TO_COMMUNITY_ON_MATTERMOST,
  featureCreateUserOnMattermost: process.env.FEATURE_CREATE_USER_ON_MATTERMOST,
  featureRemoveGithubUserFromOrganization:
    process.env.FEATURE_REMOVE_GITHUB_USER_FROM_ORGANIZATION,
  featureOnUserContractEnd: process.env.FEATURE_ON_USER_CONTRACT_END,
  featureAddExpiredUsersToAlumniOnMattermost:
    process.env.FEATURE_ADD_EXPIRED_USERS_TO_ALUMNI_ON_MATTERMOST,
  featureRemoveExpiredUsersFromCommunityOnMattermost: process.env.FEATURE_REMOVED_EXPIRED_USERS_FROM_COMMUNITY_ON_MATTERMOST,
  featureSendJ1Email: process.env.FEATURE_SEND_J1_EMAIL,
  featureSendJ30Email: process.env.FEATURE_SEND_J30_EMAIL,
  featureDeleteOVHEmailAccounts: process.env.FEATURE_DELETE_OVH_EMAIL_ACCOUNTS,
  featureDeleteSecondaryEmail: process.env.FEATURE_DELETE_SECONDARY_EMAIL,
  featureDeleteRedirectionsAfterQuitting:
    process.env.FEATURE_DELETE_REDIRECTIONS_AFTER_QUITTING,
  featureRemoveEmailsFromMailingList: process.env.FEATURE_REMOVE_EMAILS_FROM_MAILING_LIST,
  featureRemindUserWithPendingPullRequestOnAuthorFile: process.env.FEATURE_REMIND_USER_WITH_PENDING_PULL_REQUEST_ON_AUTHOR_FILE,
  featureSetEmailExpired: process.env.FEATURE_SET_EMAIL_EXPIRED,
  featureSubscribeToIncubateurMailingList: process.env.FEATURE_SUBSCRIBE_TO_INCUBATEUR_MAILING_LIST,
  featureUnsubscribeFromIncubateurMailingList: process.env.FEATURE_UNSUBSCRIBE_FROM_INCUBATEUR_MAILING_LIST,
  featureSendMessageToActiveUsersWithoutSecondaryEmail: process.env.FEATURE_SEND_MESSAGE_TO_ACTIVE_USERS_WITHOUT_SECONDARY_EMAIL,
  FEATURE_CREATE_MARRAINAGE: process.env.FEATURE_CREATE_MARRAINAGE || false,
  FEATURE_SYNC_BETAGOUV_USER_API: process.env.FEATURE_SYNC_BETAGOUV_USER_API,
  FEATURE_PUBLISH_JOBS_TO_MATTERMOST: process.env.FEATURE_PUBLISH_JOBS_TO_MATTERMOST,
  FEATURE_PUBLISH_WTTJ_JOBS_TO_MATTERMOST: process.env.FEATURE_PUBLISH_WTTJ_JOBS_TO_MATTERMOST,
  FEATURE_SEND_MESSAGE_TO_TEAM_FOR_JOB_OPENED_FOR_A_LONG_TIME: process.env.FEATURE_SEND_MESSAGE_TO_TEAM_FOR_JOB_OPENED_FOR_A_LONG_TIME,
  FEATURE_USE_NEW_MARRAINAGE: process.env.FEATURE_USE_NEW_MARRAINAGE || false,
  MARRAINAGE_ONBOARDER_LIST: process.env.MARRAINAGE_ONBOARDER_LIST ? process.env.MARRAINAGE_ONBOARDER_LIST.split(',') : undefined,
  tchap_api: process.env.TCHAP_API,
  HASH_SALT: process.env.HASH_SALT,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
};

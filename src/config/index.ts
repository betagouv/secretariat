import { MemberType } from '@/models/dbUser';
import { EMAIL_PLAN_TYPE } from '@/models/ovh';
import { config } from 'dotenv';

config();

const isSecure = (process.env.SECURE || 'true') === 'true';

const userStatusOptions = [
  { name: 'Indépendant', key: 'independent' },
  {
    name: 'Agent Public (fonctionnaire ou sous contrat stage, alternance, CDD ou CDI avec une structure publique)',
    key: 'admin',
  },
  { name: 'Société de service', key: 'service' },
];

const memberTypeOptions = [
  { name: `Membre d'une startup ou d'un incubateur`, key: MemberType.BETA },
  { name: 'Attributaire', key: MemberType.ATTRIBUTAIRE },
  {
    name: `Membre d'un autre service DINUM (etalab, ...)`,
    key: MemberType.DINUM,
  },
  { name: `Autre`, key: MemberType.OTHER },
];

const userBadgeOptions = [{ name: 'Ségur (Paris)', key: 'segur' }];

const CRON_TASK_ENV_VAR = {
  AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
  AIRTABLE_FORMATION_BASE_ID: process.env.AIRTABLE_FORMATION_BASE_ID,
};

export default {
  ...CRON_TASK_ENV_VAR,
  AUTH_URL: process.env.AUTH_URL,
  OVH_APP_KEY: process.env.OVH_APP_KEY,
  OVH_APP_SECRET: process.env.OVH_APP_SECRET,
  OVH_CONSUMER_KEY: process.env.OVH_CONSUMER_KEY,
  secret: process.env.SESSION_SECRET,
  secure: isSecure,
  protocol: isSecure ? 'https' : 'http',
  host: process.env.HOSTNAME,
  port: process.env.PORT || 8100,
  CALENDAR_URL: process.env.CALENDAR_URL,
  CALENDAR_PUBLIC_URL: process.env.CALENDAR_PUBLIC_URL,
  CALENDAR_GIP_URL: process.env.CALENDAR_GIP_URL,
  CALENDAR_GIP_PUBLIC_URL: process.env.CALENDAR_GIP_PUBLIC_URL,
  CHATWOOT_ID: process.env.CHATWOOT_ID,
  CHATWOOT_IGNORE_EMAILS: process.env.CHATWOOT_IGNORE_EMAILS || [],
  CHATWOOT_BADGE_ID: process.env.CHATWOOT_BADGE_ID,
  CORS_ORIGIN: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['https://espace-membre.incubateur.net'],
  domain: process.env.SECRETARIAT_DOMAIN || 'beta.gouv.fr',
  DS_TOKEN: process.env.DS_TOKEN,
  DS_DEMARCHE_NUMBER: process.env.DS_DEMARCHE_NUMBER
    ? parseInt(process.env.DS_DEMARCHE_NUMBER)
    : null,
  DS_DEMARCHE_RENEWAL_BADGE_NUMBER: process.env.DS_DEMARCHE_RENEWAL_BADGE_NUMBER
    ? parseInt(process.env.DS_DEMARCHE_RENEWAL_BADGE_NUMBER)
    : null,
  EMAIL_DEFAULT_PLAN:
    process.env.EMAIL_DEFAULT_PLAN || EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC,
  FRONT_APP_URL: process.env.FRONT_APP_URL,
  FRONT_APP_EMAIL_TEST: process.env.FRONT_APP_EMAIL_TEST
    ? process.env.FRONT_APP_EMAIL_TEST.split(',')
    : [],
  newsletterTemplateId: process.env.NEWSLETTER_TEMPLATE_ID,
  newsletterSentDay: process.env.NEWSLETTER_SENT_DAY || 'THURSDAY',
  padURL: process.env.PAD_URL || 'https://pad.incubateur.net',
  padEmail: process.env.PAD_USERNAME,
  padPassword: process.env.PAD_PASSWORD,
  user: {
    statusOptions: userStatusOptions,
    minStartDate: '2013-07-01',
    badgeOptions: userBadgeOptions,
    memberOptions: memberTypeOptions,
  },
  newsletterBroadcastList:
    process.env.NEWSLETTER_BROADCAST_LIST || 'secretariat@beta.gouv.fr',
  newsletterCronTime: process.env.NEWSLETTER_CRON_TIME || '0 4 * * 5',
  newsletterHashSecret: process.env.NEWSLETTER_HASH_SECRET,
  newsletterSendTime: process.env.NEWSLETTER_SEND_TIME,
  NEWSLETTER_BOT_ICON_URL: process.env.NEWSLETTER_BOT_ICON_URL,
  mattermostURL:
    process.env.MATTERMOST_URL || 'https://mattermost.incubateur.net',
  senderEmail: process.env.MAIL_SENDER || 'espace-membre@incubateur.net',
  CHAT_WEBHOOK_URL_SECRETARIAT: process.env.CHAT_WEBHOOK_URL_SECRETARIAT,
  CHAT_WEBHOOK_URL_GENERAL: process.env.CHAT_WEBHOOK_URL_GENERAL,
  CHAT_WEBHOOK_URL_DINUM: process.env.CHAT_WEBHOOK_URL_DINUM,
  CHAT_WEBHOOK_URL_GIP: process.env.CHAT_WEBHOOK_URL_GIP,
  FRONT_URL: process.env.FRONT_URL,
  SPONSOR_API:
    process.env.SPONSOR_API || 'https://beta.gouv.fr/api/v2.5/sponsors.json',
  usersAPI:
    process.env.USERS_API || 'https://beta.gouv.fr/api/v2.3/authors.json',
  incubatorAPI:
    process.env.INCUBATOR_API ||
    'https://beta.gouv.fr/api/v2.5/incubators.json',
  startupsAPI:
    process.env.STARTUPS_API || 'https://beta.gouv.fr/api/v2.5/startups.json',
  startupsDetailsAPI:
    process.env.STARTUPS_DETAILS_API ||
    'https://beta.gouv.fr/api/v2.3/startups_details.json',
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
  ESPACE_MEMBRE_ADMIN: process.env.ESPACE_MEMBRE_ADMIN
    ? process.env.ESPACE_MEMBRE_ADMIN.split(',')
    : [],
  MAILING_LIST_NEWSLETTER: process.env.MAILING_LIST_NEWSLETTER
    ? parseInt(process.env.MAILING_LIST_NEWSLETTER)
    : null,
  MAILING_LIST_ONBOARDING: process.env.MAILING_LIST_ONBOARDING
    ? parseInt(process.env.MAILING_LIST_ONBOARDING)
    : null,
  MAILING_LIST_REMINDER: process.env.MAILING_LIST_REMINDER
    ? parseInt(process.env.MAILING_LIST_REMINDER)
    : null,
  MARRAINAGE_GROUP_LIMIT: parseInt(process.env.MARRAINAGE_GROUP_LIMIT) || 5,
  MARRAINAGE_GROUP_WEEK_LIMIT:
    parseInt(process.env.MARRAINAGE_GROUP_WEEK_LIMIT) || 2,
  mattermostBotToken: process.env.MATTERMOST_BOT_TOKEN,
  mattermostTeamId: process.env.MATTERMOST_TEAM_ID || 'testteam',
  mattermostAlumniTeamId:
    process.env.MATTERMOST_ALUMNI_TEAM_ID || 'testalumniteam',
  mattermostInvitationLink: process.env.MATTERMOST_INVITATION_LINK || '',
  MATTERMOST_INVITE_ID: process.env.MATTERMOST_INVITE_ID,
  MATTERMOST_ALLOWED_DOMAINS:
    process.env.MATTERMOST_ALLOWED_DOMAINS || 'beta.gouv.fr',
  MATTERMOST_PARTNERS_AUTHORS_URL: process.env.MATTERMOST_PARTNERS_AUTHORS_URL,
  MATTERMOST_PARTNERS_AUTHORS_URLS: process.env.MATTERMOST_PARTNERS_AUTHORS_URLS
    ? JSON.parse(process.env.MATTERMOST_PARTNERS_AUTHORS_URLS)
    : [],
  MATTERMOST_EMAIL_REGEX_EXCEPTION:
    process.env.MATTERMOST_EMAIL_REGEX_EXCEPTION,
  OVH_EMAIL_PRO_NAME: process.env.OVH_EMAIL_PRO_NAME,
  OVH_EMAIL_EXCHANGE_NAME: process.env.OVH_EMAIL_EXCHANGE_NAME,
  investigationReportsIframeURL:
    process.env.INVESTIGATION_REPORTS_IFRAME_URL || '',
  incubateurMailingListName:
    process.env.INCUBATEUR_MAILING_LIST_NAME || 'incubateur',
  JOBS_API: process.env.JOBS_API || 'https://beta.gouv.fr/api/v2.5/jobs.json',
  JOBS_WTTJ_API: process.env.JOBS_WTTJ_API,
  leavesEmail: process.env.LEAVES_EMAIL || 'depart@beta.gouv.fr',
  featureReinitPasswordEmail:
    process.env.FEATURE_REINIT_PASSWORD_EMAIL === 'true',
  featureReactiveMattermostUsers:
    process.env.FEATURE_REACTIVE_MATTERMOST_USERS === 'true',
  featureAddGithubUserToOrganization:
    process.env.FEATURE_ADD_GITHUB_USER_TO_ORGANIZATION === 'true',
  featureAddUserToCommunityTeam:
    process.env.FEATURE_ADD_USER_TO_COMMUNITY_ON_MATTERMOST === 'true',
  featureCreateUserOnMattermost:
    process.env.FEATURE_CREATE_USER_ON_MATTERMOST === 'true',
  featureRemoveGithubUserFromOrganization:
    process.env.FEATURE_REMOVE_GITHUB_USER_FROM_ORGANIZATION === 'true',
  featureOnUserContractEnd: process.env.FEATURE_ON_USER_CONTRACT_END === 'true',
  featureAddExpiredUsersToAlumniOnMattermost:
    process.env.FEATURE_ADD_EXPIRED_USERS_TO_ALUMNI_ON_MATTERMOST === 'true',
  featureRemoveExpiredUsersFromCommunityOnMattermost:
    process.env.FEATURE_REMOVED_EXPIRED_USERS_FROM_COMMUNITY_ON_MATTERMOST ===
    'true',
  featureSendJ1Email: process.env.FEATURE_SEND_J1_EMAIL === 'true',
  featureSendJ30Email: process.env.FEATURE_SEND_J30_EMAIL === 'true',
  featureDeleteOVHEmailAccounts:
    process.env.FEATURE_DELETE_OVH_EMAIL_ACCOUNTS === 'true',
  featureDeleteSecondaryEmail:
    process.env.FEATURE_DELETE_SECONDARY_EMAIL === 'true',
  featureDeleteRedirectionsAfterQuitting:
    process.env.FEATURE_DELETE_REDIRECTIONS_AFTER_QUITTING === 'true',
  featureRemoveEmailsFromMailingList:
    process.env.FEATURE_REMOVE_EMAILS_FROM_MAILING_LIST === 'true',
  featureRemindUserWithPendingPullRequestOnAuthorFile:
    process.env.FEATURE_REMIND_USER_WITH_PENDING_PULL_REQUEST_ON_AUTHOR_FILE ===
    'true',
  featureSetEmailExpired: process.env.FEATURE_SET_EMAIL_EXPIRED === 'true',
  featureSubscribeToIncubateurMailingList:
    process.env.FEATURE_SUBSCRIBE_TO_INCUBATEUR_MAILING_LIST === 'true',
  featureUnsubscribeFromIncubateurMailingList:
    process.env.FEATURE_UNSUBSCRIBE_FROM_INCUBATEUR_MAILING_LIST === 'true',
  featureSendMessageToActiveUsersWithoutSecondaryEmail:
    process.env.FEATURE_SEND_MESSAGE_TO_ACTIVE_USERS_WITHOUT_SECONDARY_EMAIL ===
    'true',
  FEATURE_CREATE_MARRAINAGE: process.env.FEATURE_CREATE_MARRAINAGE === 'true',
  FEATURE_MATTERMOST_REMOVE_USERS:
    process.env.FEATURE_MATTERMOST_REMOVE_USERS === 'true',
  FEATURE_SYNC_BETAGOUV_USER_API:
    process.env.FEATURE_SYNC_BETAGOUV_USER_API === 'true',
  FEATURE_PUBLISH_JOBS_TO_MATTERMOST:
    process.env.FEATURE_PUBLISH_JOBS_TO_MATTERMOST === 'true',
  FEATURE_PUBLISH_WTTJ_JOBS_TO_MATTERMOST:
    process.env.FEATURE_PUBLISH_WTTJ_JOBS_TO_MATTERMOST === 'true',
  // If both emails of the users are already in sib update will not work
  FEATURE_SIB_USE_UPDATE_CONTACT_EMAIL:
    process.env.FEATURE_SIB_USE_UPDATE_CONTACT_EMAIL === 'true',
  FEATURE_SEND_EMAIL_TO_STARTUP_TO_UPDATE_PHASE:
    process.env.FEATURE_SEND_EMAIL_TO_STARTUP_TO_UPDATE_PHASE === 'true',
  FEATURE_SEND_MESSAGE_TO_TEAM_FOR_JOB_OPENED_FOR_A_LONG_TIME:
    process.env.FEATURE_SEND_MESSAGE_TO_TEAM_FOR_JOB_OPENED_FOR_A_LONG_TIME ===
    'true',
  FEATURE_USE_NEW_MARRAINAGE: process.env.FEATURE_USE_NEW_MARRAINAGE === 'true',
  FEATURE_NEWSLETTER: process.env.FEATURE_NEWSLETTER === 'true',
  FEATURE_SEND_NEWSLETTER: process.env.FEATURE_SEND_NEWSLETTER === 'true',
  FEATURE_REMINDER_TEAM_IF_PENDING_PR_ON_AUTHOR_FILE:
    process.env.FEATURE_REMINDER_TEAM_IF_PENDING_PR_ON_AUTHOR_FILE === 'true',
  MARRAINAGE_ONBOARDER_LIST: process.env.MARRAINAGE_ONBOARDER_LIST
    ? process.env.MARRAINAGE_ONBOARDER_LIST.split(',')
    : undefined,
  SIB_WEBHOOK_ID: process.env.SIB_WEBHOOK_ID,
  SIB_APIKEY_PRIVATE: process.env.SIB_APIKEY_PRIVATE,
  SIB_APIKEY_PUBLIC: process.env.SIB_APIKEY_TECH_PUBLIC,
  SIB_APIKEY_TECH_PRIVATE: process.env.SIB_APIKEY_TECH_PRIVATE,
  SIB_APIKEY_TECH_PUBLIC: process.env.SIB_APIKEY_TECH_PUBLIC,
  tchap_api: process.env.TCHAP_API,
  HASH_SALT: process.env.HASH_SALT,
  REDIS_URL: process.env.REDIS_URL,
};

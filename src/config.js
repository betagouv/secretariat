require('dotenv').config();

const isSecure = (process.env.SECURE || 'true') === 'true';

const userStatusOptions = [
  { label: 'Indépendant', value: 'independent' },
  { label: 'Administration (fonctionnaire ou sous contrat stage, alternance, CDD ou CDI)', value: 'admin' },
  { label: 'Société de service', value: 'service' },
];

const userBadgeOptions = [
  { label: 'Ségur (Paris)', value: 'segur' },
];

module.exports = {
  secret: process.env.SESSION_SECRET,
  secure: isSecure,
  protocol: isSecure ? 'https' : 'http',
  host: process.env.HOSTNAME,
  port: process.env.PORT || 8100,
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
  newsletterBroadcastList: process.env.NEWSLETTER_BROADCAST_LIST || 'secretariat@beta.gouv.fr',
  newsletterCronTime: process.env.NEWSLETTER_CRON_TIME || '0 4 * * 5',
  newsletterHashSecret: process.env.NEWSLETTER_HASH_SECRET,
  newsletterSendTime: process.env.NEWSLETTER_SEND_TIME,
  senderEmail: process.env.MAIL_SENDER || 'secretariat@incubateur.net',
  slackWebhookURLSecretariat: process.env.SLACK_WEBHOOK_URL_SECRETARIAT,
  slackWebhookURLGeneral: process.env.SLACK_WEBHOOK_URL_GENERAL,
  usersAPI: process.env.USERS_API || 'https://beta.gouv.fr/api/v2.1/authors.json',
  startupsAPI: process.env.STARTUPS_API || 'https://beta.gouv.fr/api/v2/startups.json',
  githubToken: process.env.GITHUB_TOKEN,
  githubOrganizationName: process.env.GITHUB_ORGANIZATION_NAME || 'betagouv',
  githubOrgAdminToken: process.env.GITHUB_ORG_ADMIN_TOKEN,
  githubRepository: process.env.GITHUB_REPOSITORY,
  githubFork: process.env.GITHUB_FORK,
  defaultLoggedInRedirectUrl: '/account',
  visitRecipientEmail: process.env.VISIT_MAIL_RECIPIENT || 'secretariat@incubateur.net',
  visitSenderEmail: process.env.VISIT_MAIL_SENDER || 'secretariat@beta.gouv.fr',
  sentryDNS: process.env.SENTRY_DNS || false,
  mattermostBotToken: process.env.MATTERMOST_BOT_TOKEN,
  mattermostTeamId: process.env.MATTERMOST_TEAM_ID || 'testteam',
  mattermostInvitationLink: process.env.MATTERMOST_INVITATION_LINK || '',
  investigationReportsIframeURL: process.env.INVESTIGATION_REPORTS_IFRAME_URL || '',
  leavesEmail: process.env.LEAVES_EMAIL || 'depart@beta.gouv.fr',
  featureAddGithubUserToOrganization: process.env.FEATURE_ADD_GITHUB_USER_TO_ORGANIZATION,
};

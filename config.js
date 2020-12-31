const isSecure = (process.env.SECURE || 'true') === 'true';

const memberStatusOptions = [
  { label: 'Indépendant', value: 'independent' },
  { label: 'Administration (fonctionnaire ou sous contrat stage, alternance, CDD ou CDI)', value: 'admin' },
  { label: 'Société de service', value: 'service' },
];

const memberBadgeOptions = [
  { label: 'Ségur', value: 'segur' },
];

module.exports = {
  secret: process.env.SESSION_SECRET,
  secure: isSecure,
  protocol: isSecure ? 'https' : 'http',
  host: process.env.HOSTNAME,
  port: process.env.PORT || 8100,
  domain: process.env.SECRETARIAT_DOMAIN || 'beta.gouv.fr',
  member: {
    statusOptions: memberStatusOptions,
    minStartDate: '2013-07-01',
    badgeOptions: memberBadgeOptions,
  },
  senderEmail: process.env.MAIL_SENDER || 'secretariat@incubateur.net',
  slackWebhookURL: process.env.SLACK_WEBHOOK_URL,
  usersAPI: process.env.USERS_API || 'https://beta.gouv.fr/api/v2.1/authors.json',
  startupsAPI: process.env.STARTUPS_API || 'https://beta.gouv.fr/api/v2/startups.json',
  githubToken: process.env.GITHUB_TOKEN,
  githubRepository: process.env.GITHUB_REPOSITORY,
  githubFork: process.env.GITHUB_FORK,
  defaultLoggedInRedirectUrl: '/community',
};

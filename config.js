const isSecure = (process.env.SECURE || 'true') === 'true';

module.exports = {
  secret: process.env.SESSION_SECRET,
  secure: isSecure,
  protocol: isSecure ? 'https' : 'http',
  port: process.env.PORT || 8100,
  domain: process.env.SECRETARIAT_DOMAIN || "beta.gouv.fr",
  senderEmail: process.env.MAIL_SENDER || "secretariat@incubateur.net",
  githubToken: process.env.GITHUB_TOKEN,
  githubRepository: process.env.GITHUB_REPOSITORY,
  githubFork: process.env.GITHUB_FORK,
  defaultLoggedInRedirectUrl: '/community',
};

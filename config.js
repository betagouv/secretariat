const isSecure = (process.env.SECURE || 'true') === 'true';

module.exports = {
  secret: process.env.SESSION_SECRET,
  secure: isSecure,
  protocol: isSecure ? 'https' : 'http',
  port: process.env.PORT || 8100,
  domain: process.env.SECRETARIAT_DOMAIN || "beta.gouv.fr",
  senderEmail: process.env.MAIL_SENDER || "secretariat@incubateur.net",
};

module.exports = {
  secret: process.env.SESSION_SECRET,
  port: process.env.PORT || 8100,
  secure: (process.env.SECURE || 'true') === 'true',
  senderEmail: process.env.MAIL_SENDER || 'secretariat@incubateur.net',
  domain: process.env.SECRETARIAT_DOMAIN || 'beta.gouv.fr',
};

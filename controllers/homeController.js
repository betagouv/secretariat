const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');
const PromiseMemoize = require('promise-memoize');
const isBetaEmail = email => email && email.endsWith(`${config.domain}`);
const buildBetaEmail = require('./utils').buildBetaEmail;

const getBetaEmailId = email => email && email.split('@')[0];

const emailWithMetadataMemoized = PromiseMemoize(
  async () => {
    const [accounts, users] = await Promise.all([
      BetaGouv.accounts(),
      BetaGouv.usersInfos()
    ]);

    console.log('users', users.length);

    const emails = Array.from(
      new Set([
        ...accounts.map(buildBetaEmail)
      ])
    ).sort();

    return emails.map(email => {
      const id = getBetaEmailId(email);
      const user = users.find(ui => ui.id === id);

      return {
        id,
        email: email,
        github: user !== undefined,
        account: accounts.includes(id),
        endDate: user ? user.end : undefined,
        expired:
          user &&
          user.end &&
          new Date(user.end).getTime() < new Date().getTime()
      };
    });
  },
  {
    maxAge: 120000
  }
);

module.exports.getHome = async function (req, res) {
  if (req.query.id) {
    return res.redirect(`/users/${req.query.id}`);
  }
  const emails = await emailWithMetadataMemoized();
  const expiredEmails = emails.filter(user => user.expired)

  try {
    const users = await BetaGouv.usersInfos();
    const currentUser = await utils.userInfos(req.user.id, true);

    res.render('newhome', {
      emailInfos: currentUser.emailInfos,
      userInfos: currentUser.userInfos,
      users: users,
      domain: config.domain,
      errors: req.flash('error'),
      messages: req.flash('message'),
      isExpired: currentUser.isExpired,
      canCreateEmail: currentUser.canCreateEmail,
      canCreateRedirection: currentUser.canCreateRedirection,
      canChangePassword: currentUser.canChangePassword,
      redirections: currentUser.redirections,
      emails: emails,
      expiredEmails: expiredEmails
    });
  } catch (err) {
    console.error(err);

    res.render('newhome', {
      currentUser: req.user,
      users: [],
      domain: config.domain,
      errors: [
        `Erreur interne: impossible de récupérer la liste des membres sur ${config.domain}.`
      ],
      messages: []
    });
  }
}
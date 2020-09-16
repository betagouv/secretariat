const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');
const PromiseMemoize = require('promise-memoize');
const isBetaEmail = email => email && email.endsWith(`${config.domain}`);
const buildBetaEmail = require('./utils').buildBetaEmail;

const getBetaEmailId = email => email && email.split('@')[0];

const emailWithMetadataMemoized = PromiseMemoize(
  async () => {
    const [accounts, redirections, users] = await Promise.all([
      BetaGouv.accounts(),
      BetaGouv.redirections(),
      BetaGouv.usersInfos()
    ]);

    console.log('users', users.length);

    const emails = Array.from(
      new Set([
        ...redirections.reduce(
          (acc, r) => (!isBetaEmail(r.to) ? [...acc, r.from] : acc),
          []
        ),
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
        redirections: redirections.reduce(
          (acc, r) => (r.from === email ? [...acc, r.to] : acc),
          []
        ),
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

module.exports.getAccount = async function (req, res) {
  try {
    const currentUser = await utils.userInfos(req.user.id, true);
    res.render('account', {
      emailInfos: currentUser.emailInfos,
      userInfos: currentUser.userInfos,
      domain: config.domain,
      isExpired: currentUser.isExpired,
      canCreateEmail: currentUser.canCreateEmail,
      canCreateRedirection: currentUser.canCreateRedirection,
      canChangePassword: currentUser.canChangePassword,
      redirections: currentUser.redirections,
      activeTab: 'account',
      errors: req.flash('error'),
      messages: req.flash('message'),
    });
  } catch (err) {
    console.error(err);
    res.send(err);
  }
}

module.exports.getCommunity = async function (req, res) {
  try {
    const users = await BetaGouv.usersInfos();
    const currentUser = await utils.userInfos(req.user.id, true);
    res.render('community', {
      domain: config.domain,
      users: users,
      userInfos: currentUser.userInfos,
      activeTab: 'community',
      errors: req.flash('error'),
      messages: req.flash('message')
    });
  } catch (err) {
    console.error(err);
    req.flash('error', `Erreur interne: impossible de récupérer la liste des membres sur ${config.domain}`);
    res.redirect(`/account`);
  }
}

module.exports.getAdmin = async function (req, res) {
  try {
    const emails = await emailWithMetadataMemoized();
    const expiredEmails = emails.filter(user => user.expired)
    const currentUser = await utils.userInfos(req.user.id, true);
    res.render('admin', {
      currentUser: req.user,
      userInfos: currentUser.userInfos,
      emails,
      expiredEmails,
      errors: [],
      activeTab: 'admin',
      errors: req.flash('error'),
      messages: req.flash('message')
    });
  } catch (err) {
    console.error(err);
    req.flash('error', `Erreur interne`);
    res.redirect(`/account`);
  }
}

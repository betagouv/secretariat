const PromiseMemoize = require('promise-memoize');
const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');

const isBetaEmail = (email) => email && email.endsWith(`${config.domain}`);

const getBetaEmailId = (email) => email && email.split('@')[0];

const emailWithMetadataMemoized = PromiseMemoize(
  async () => {
    const [accounts, redirections, users] = await Promise.all([
      BetaGouv.accounts(),
      BetaGouv.redirections(),
      BetaGouv.usersInfos(),
    ]);

    console.log('users', users.length);

    const emails = Array.from(
      new Set([
        ...redirections.reduce(
          (acc, r) => (!isBetaEmail(r.to) ? [...acc, r.from] : acc),
          [],
        ),
        ...accounts.map(utils.buildBetaEmail),
      ]),
    ).sort();

    return emails.map((email) => {
      const id = getBetaEmailId(email);
      const user = users.find((ui) => ui.id === id);

      return {
        id,
        email,
        github: user !== undefined,
        redirections: redirections.reduce(
          (acc, r) => (r.from === email ? [...acc, r.to] : acc),
          [],
        ),
        account: accounts.includes(id),
        endDate: user ? user.end : undefined,
        expired:
          user
          && user.end
          && new Date(user.end).getTime() < new Date().getTime(),
      };
    });
  },
  {
    maxAge: 120000,
  },
);

module.exports.getEmailLists = async function (req, res) {
  try {
    const emails = await emailWithMetadataMemoized();
    const expiredEmails = emails.filter((user) => user.expired);
    const currentUser = await utils.userInfos(req.user.id, true);
    res.render('admin', {
      currentUserId: req.user.id,
      userInfos: currentUser.userInfos,
      emails,
      expiredEmails,
      activeTab: 'admin',
      errors: req.flash('error'),
      messages: req.flash('message'),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur interne');
    res.redirect('/account');
  }
};

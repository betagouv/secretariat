const config = require('../config')
const BetaGouv = require('../betagouv');
const PromiseMemoize = require('promise-memoize');
const buildBetaEmail = require('./utils').buildBetaEmail;

const getBetaEmailId = email => email && email.split('@')[0];
const isBetaEmail = email => email && email.endsWith(`${config.domain}`);

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
        email: email,
        github: user != undefined,
        redirections: redirections.reduce(
          (acc, r) => (r.from === email ? [...acc, r.to] : acc),
          []
        ),
        account: accounts.includes(id),
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

module.exports.getEmails = async function (req, res) {
  try {
    const emails = await emailWithMetadataMemoized();

    res.render('emails', {
      user: req.user,
      emails,
      partials: {
        header: 'header',
        footer: 'footer'
      }
    });
  } catch (err) {
    console.error(err);

    res.render('emails', {
      errors: ['Erreur interne'],
      user: req.user,
      partials: {
        header: 'header',
        footer: 'footer'
      }
    });
  }
}

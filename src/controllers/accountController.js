const config = require('../config');
const utils = require('./utils');
const knex = require('../db');

module.exports.getCurrentAccount = async function (req, res) {
  try {
    const [currentUser, marrainageState, secondaryEmail] = await Promise.all([
      (async () => utils.userInfos(req.user.id, true))(),
      (async () => {
        const [state] = await knex('marrainage').where({ username: req.user.id });
        return state;
      })(),
      (async () => {
        const rows = await knex('users').where({ username: req.user.id });
        return rows.length === 1 ? rows[0].secondary_email : null;
      })(),
    ]);

    const title = 'Mon compte';
    return res.render('account', {
      title,
      currentUserId: req.user.id,
      emailInfos: currentUser.emailInfos,
      userInfos: currentUser.userInfos,
      domain: config.domain,
      isExpired: currentUser.isExpired,
      canCreateEmail: currentUser.canCreateEmail,
      canCreateRedirection: currentUser.canCreateRedirection,
      canChangePassword: currentUser.canChangePassword,
      redirections: currentUser.redirections,
      activeTab: 'account',
      marrainageState,
      secondaryEmail,
      errors: req.flash('error'),
      messages: req.flash('message'),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Impossible de récupérer vos informations.');
    return res.redirect('/');
  }
};

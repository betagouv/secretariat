const config = require('../config');
const utils = require('./utils');
const knex = require('../db');

module.exports.getCurrentAccount = async function (req, res) {
  try {
    const currentUser = await utils.userInfos(req.user.id, true);
    const marrainageStateResponse = await knex('marrainage').select()
      .where({ username: req.user.id });
    const marrainageState = marrainageStateResponse[0];
    res.render('account', {
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
      errors: req.flash('error'),
      messages: req.flash('message'),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur interne : impossible de récupérer vos informations');
    return res.redirect('/');
  }
};

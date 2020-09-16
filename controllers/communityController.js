const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');

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

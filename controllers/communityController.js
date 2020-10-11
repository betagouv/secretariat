const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');

module.exports.getCommunity = async function (req, res) {
  if (req.query.id) {
    return res.redirect(`/community/${req.query.id}`);
  }
  try {
    const users = await BetaGouv.usersInfos();
    const currentUser = await utils.userInfos(req.user.id, true);
    res.render('community', {
      currentUserId: req.user.id,
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

module.exports.getMember = async function(req, res) {
  const requestedUserId = req.params.id;

  try {
    const isCurrentUser = req.user.id === requestedUserId;

    if (isCurrentUser) {
      res.redirect(`/account`);
      return;
    }

    const user = await utils.userInfos(requestedUserId, isCurrentUser);

    res.render('member', {
      requestedUserId,
      currentUserId: req.user.id,
      emailInfos: user.emailInfos,
      redirections: user.redirections,
      userInfos: user.userInfos,
      isExpired: user.isExpired,
      canCreateEmail: user.canCreateEmail,
      errors: req.flash('error'),
      messages: req.flash('message'),
      domain: config.domain,
      activeTab: 'community'
    });
  } catch (err) {
    console.error(err);
    res.send(err);
  }
}

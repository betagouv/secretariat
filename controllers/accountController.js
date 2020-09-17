const config = require('../config');
const utils = require('./utils');

module.exports.getCurrentAccount = async function (req, res) {
  try {
    const currentUser = await utils.userInfos(req.user.id, true);
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
      errors: req.flash('error'),
      messages: req.flash('message'),
    });
  } catch (err) {
    console.error(err);
    res.send(err);
  }
}

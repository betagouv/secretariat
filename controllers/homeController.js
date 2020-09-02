const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');


module.exports.getHome = async function (req, res) {
  if (req.query.id) {
    return res.redirect(`/users/${req.query.id}`);
  }

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
      redirections: currentUser.redirections
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
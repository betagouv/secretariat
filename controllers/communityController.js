const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');
const knex = require('../db');

module.exports.getCommunity = async function (req, res) {
  if (req.query.username) {
    return res.redirect(`/community/${req.query.username}`);
  }
  try {
    const users = await BetaGouv.usersInfos();
    const userAgent = Object.prototype.hasOwnProperty.call(req.headers, 'user-agent') ? req.headers['user-agent'] : null;
    const isMobileFirefox = userAgent && /Android.+Firefox\//.test(userAgent);
    const title = 'Communauté';
    return res.render('community', {
      title,
      currentUserId: req.user.id,
      domain: config.domain,
      users,
      activeTab: 'community',
      errors: req.flash('error'),
      messages: req.flash('message'),
      useSelectList: isMobileFirefox,
    });
  } catch (err) {
    console.error(err);
    return res.send('Erreur interne : impossible de récupérer les informations de la communauté');
  }
};

module.exports.getMember = async function (req, res) {
  const { username } = req.params;
  const isCurrentUser = req.user.id === username;

  try {
    if (isCurrentUser) {
      res.redirect('/account');
      return;
    }

    const user = await utils.userInfos(username, isCurrentUser);

    const hasGithubFile = user.userInfos;
    const hasEmailAddress = (user.emailInfos || user.redirections.length > 0);
    if (!hasGithubFile && !hasEmailAddress) {
      req.flash('error', 'Il n\'y a pas d\'utilisateurs avec ce compte mail. Vous pouvez commencez par créer une fiche sur Github pour la personne <a href="/onboarding">en cliquant ici</a>.');
      res.redirect('/community');
      return;
    }
    const marrainageStateResponse = await knex('marrainage').select()
      .where({ username });
    const marrainageState = marrainageStateResponse[0];

    const title = user.userInfos ? user.userInfos.fullname : null;
    res.render('member', {
      title,
      username,
      currentUserId: req.user.id,
      emailInfos: user.emailInfos,
      redirections: user.redirections,
      userInfos: user.userInfos,
      isExpired: user.isExpired,
      canCreateEmail: user.canCreateEmail,
      errors: req.flash('error'),
      messages: req.flash('message'),
      domain: config.domain,
      marrainageState,
      activeTab: 'community',
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Impossible de récupérer les informations du membre de la communauté.');
    res.redirect('/');
  }
};

const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');
const knex = require('../db');

module.exports.getCommunity = async function (req, res) {
  if (req.query.id) {
    return res.redirect(`/community/${req.query.id}`);
  }
  try {
    const users = await BetaGouv.usersInfos();
    const title = 'Communauté';
    return res.render('community', {
      title: title,
      currentUserId: req.user.id,
      domain: config.domain,
      users,
      activeTab: 'community',
      errors: req.flash('error'),
      messages: req.flash('message'),
    });
  } catch (err) {
    console.error(err);
    return res.send('Erreur interne : impossible de récupérer les informations de la communauté');
  }
};

module.exports.getMember = async function (req, res) {
  const requestedUserId = req.params.id;

  try {
    const isCurrentUser = req.user.id === requestedUserId;

    if (isCurrentUser) {
      res.redirect('/account');
      return;
    }

    const user = await utils.userInfos(requestedUserId, isCurrentUser);

    const hasGithubFile = user.userInfos;
    const hasEmailAddress = (user.emailInfos || user.redirections.length > 0);
    if (!hasGithubFile && !hasEmailAddress) {
      req.flash('error', 'Il n\'y a pas d\'utilisateurs avec ce compte mail. Vous pouvez commencez par créer une fiche sur Github pour la personne <a href="/onboarding">en cliquant ici</a>.');
      res.redirect('/community');
      return;
    }
    const marrainageStateResponse = await knex('marrainage').select()
      .where({ username: requestedUserId });
    const marrainageState = marrainageStateResponse[0];

    const title = user.userInfos.fullname;
    res.render('member', {
      title: title,
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
      marrainageState,
      activeTab: 'community',
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur interne : impossible de récupérer les informations du membre de la communauté');
    res.redirect('/');
  }
};

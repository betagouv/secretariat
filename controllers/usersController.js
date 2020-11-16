const ejs = require('ejs');
const crypto = require('crypto');
const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');

module.exports.createEmailForUser = async function (req, res) {
  const { username } = req.params;
  const isCurrentUser = req.user.id === username;

  try {
    const user = await utils.userInfos(username, isCurrentUser);

    if (!user.userInfos) {
      throw new Error(
        `L'utilisateur·rice ${username} n'a pas de fiche sur Github : vous ne pouvez pas créer son compte email.`,
      );
    }

    if (user.isExpired) {
      throw new Error(
        `Le compte de l'utilisateur·rice ${username} est expiré.`,
      );
    }

    if (!user.canCreateEmail) {
      throw new Error("Vous n'avez pas le droit de créer le compte email de l'utilisateur·rice.");
    }

    if (!isCurrentUser) {
      const loggedUserInfo = await BetaGouv.userInfosById(req.user.id);
      if (utils.checkUserIsExpired(loggedUserInfo)) {
        throw new Error('Vous ne pouvez pas créer le compte email car votre compte a une date de fin expiré sur Github.');
      }
    }

    const email = utils.buildBetaEmail(username);
    const password = crypto.randomBytes(16).toString('base64').slice(0, -2);

    console.log(
      `Création de compte by=${req.user.id}&email=${email}&to_email=${req.body.to_email}`,
    );

    const secretariatUrl = `${config.protocol}://${req.get('host')}`;

    const message = `À la demande de ${req.user.id} sur <${secretariatUrl}>, je crée un compte mail pour ${username}`;

    await BetaGouv.sendInfoToSlack(message);
    await BetaGouv.createEmail(username, password);

    const html = await ejs.renderFile('./views/emails/createEmail.ejs', { email, password, secretariatUrl });

    try {
      await utils.sendMail(req.body.to_email, `Ton adresse ${email} est prête`, html);
    } catch (err) {
      throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
    }

    req.flash('message', 'Le compte email a bien été créé.');
    res.redirect(`/community/${username}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect('/community');
  }
};

module.exports.createRedirectionForUser = async function (req, res) {
  const { username } = req.params;
  const isCurrentUser = req.user.id === username;

  try {
    const user = await utils.userInfos(username, isCurrentUser);

    // TODO: généraliser ce code dans un `app.param("id")` ?
    if (!user.userInfos) {
      throw new Error(
        `L'utilisateur·rice ${username} n'a pas de fiche sur Github : vous ne pouvez pas créer de redirection.`,
      );
    }

    if (user.isExpired) {
      throw new Error(
        `Le compte de l'utilisateur·rice ${username} est expiré.`,
      );
    }

    if (!user.canCreateRedirection) {
      throw new Error("Vous n'avez pas le droit de créer de redirection.");
    }

    console.log(
      `Création d'une redirection d'email id=${req.user.id}&from_email=${username}&to_email=${req.body.to_email}&keep_copy=${req.body.keep_copy}`,
    );

    const secretariatUrl = `${config.protocol}://${req.get('host')}`;

    const message = `À la demande de ${req.user.id} sur <${secretariatUrl}>, je crée une redirection mail pour ${username}`;

    try {
      await BetaGouv.sendInfoToSlack(message);
      await BetaGouv.createRedirection(
        utils.buildBetaEmail(username),
        req.body.to_email,
        req.body.keep_copy === 'true',
      );
    } catch (err) {
      throw new Error(`Erreur pour créer la redirection: ${err}`);
    }

    req.flash('message', 'La redirection a bien été créé.');
    res.redirect(`/community/${username}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/community/${username}`);
  }
};

module.exports.deleteRedirectionForUser = async function (req, res) {
  const { username, email: to_email } = req.params;
  const isCurrentUser = req.user.id === username;

  try {
    const user = await utils.userInfos(username, isCurrentUser);
    // TODO: vérifier si l'utilisateur·rice existe sur Github ?

    if (!user.canCreateRedirection) {
      throw new Error("Vous n'avez pas le droit de supprimer cette redirection.");
    }

    console.log(`Suppression de la redirection by=${username}&to_email=${to_email}`);

    const secretariatUrl = `${config.protocol}://${req.get('host')}`;

    const message = `À la demande de ${req.user.id} sur <${secretariatUrl}>, je supprime la redirection mail de ${username} vers ${to_email}`;

    try {
      await BetaGouv.sendInfoToSlack(message);
      await BetaGouv.deleteRedirection(utils.buildBetaEmail(username), to_email);
    } catch (err) {
      throw new Error(`Erreur pour supprimer la redirection: ${err}`);
    }

    req.flash('message', 'La redirection a bien été supprimée.');
    res.redirect(`/community/${username}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/community/${username}`);
  }
};

module.exports.updatePasswordForUser = async function (req, res) {
  const { username } = req.params;
  const isCurrentUser = req.user.id === username;

  try {
    const user = await utils.userInfos(username, isCurrentUser);

    if (!user.userInfos) {
      throw new Error(
        `L'utilisateur·rice ${username} n'a pas de fiche sur Github : vous ne pouvez pas modifier le mot de passe.`,
      );
    }

    if (user.isExpired) {
      throw new Error(
        `Le compte de l'utilisateur·rice ${username} est expiré.`,
      );
    }

    if (!user.canChangePassword) {
      throw new Error("Vous n'avez pas le droit de changer le mot de passe.");
    }

    const password = req.body.new_password;

    if (
      !password
      || password.length < 9
      || password.length > 30
      || password !== password.trim()
    ) {
      throw new Error(
        "Le mot de passe doit comporter de 9 à 30 caractères, ne pas contenir d'accents ni d'espace au début ou à la fin.",
      );
    }

    const email = utils.buildBetaEmail(username);

    console.log(`Changement de mot de passe by=${req.user.id}&email=${email}`);

    const secretariatUrl = `${config.protocol}://${req.get('host')}`;

    const message = `À la demande de ${req.user.id} sur <${secretariatUrl}>, je change le mot de passe pour ${username}.`;

    await BetaGouv.sendInfoToSlack(message);
    await BetaGouv.changePassword(username, password);

    req.flash('message', 'Le mot de passe a bien été modifié.');
    res.redirect(`/community/${username}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/community/${username}`);
  }
};

module.exports.deleteEmailForUser = async function (req, res) {
  const { username } = req.params;
  const isCurrentUser = req.user.id === username;

  try {
    const user = await utils.userInfos(username, isCurrentUser);

    if (!isCurrentUser && !user.isExpired) {
      throw new Error(
        `Le compte "${username}" n'est pas expiré, vous ne pouvez pas supprimer ce compte.`,
      );
    }

    await BetaGouv.sendInfoToSlack(`Suppression de compte de ${username} (à la demande de ${req.user.id})`);

    if (user.redirections && user.redirections.length > 0) {
      await BetaGouv.requestRedirections('DELETE', user.redirections.map((x) => x.id));
      console.log(`Supression des redirections de l'email de ${username} (à la demande de ${req.user.id})`);
    }

    await BetaGouv.deleteEmail(username);
    console.log(`Supression de compte email de ${username} (à la demande de ${req.user.id})`);

    if (isCurrentUser) {
      res.clearCookie('token');
      req.flash('message', 'Ton compte email a bien été supprimé.');
      res.redirect('/login');
    } else {
      req.flash('message', `Le compte email de ${username} a bien été supprimé.`);
      res.redirect(`/community/${username}`);
    }
  } catch (err) {
    console.error(err);
    req.flash('error', err.message);
    res.redirect(`/community/${username}`);
  }
};

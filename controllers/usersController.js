const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');


module.exports.createEmailForUser = async function (req, res) {
  const id = req.params.id;
  const isCurrentUser = req.user.id === id;

  try {
    const user = await utils.userInfos(id, isCurrentUser);

    if (!user.userInfos) {
      throw new Error(
        `L'utilisateur·rice ${id} n'a pas de fiche sur Github : vous ne pouvez pas créer son compte email.`
      );
    }

    if (user.isExpired) {
      throw new Error(
        `Le compte de l'utilisateur·rice ${id} est expiré.`
      );
    }

    if (!user.canCreateEmail) {
      throw new Error("Vous n'avez pas le droit de créer le compte email de l'utilisateur·rice.");
    }

    if (!isCurrentUser) {
      const loggedUserInfo = await BetaGouv.userInfosById(req.user.id)
      if (utils.checkUserIsExpired(loggedUserInfo)) {
        throw new Error("Vous ne pouvez pas créer le compte email car votre compte a une date de fin expiré sur Github.");
      }
    }

    const password = Math.random()
      .toString(36)
      .slice(-10);
    const email = utils.buildBetaEmail(id);

    console.log(
      `Création de compte by=${req.user.id}&email=${email}&to_email=${req.body.to_email}&createRedirection=${req.body.createRedirection}&keep_copy=${req.body.keep_copy}`
    );

    const url = `${config.protocol}://${req.get('host')}`;

    const message = `À la demande de ${req.user.id} sur <${url}>, je crée un compte mail pour ${id}`;

    await BetaGouv.sendInfoToSlack(message);
    await BetaGouv.createEmail(id, password);

    const html = `
      <h1>Ton compte ${email} a été créé !</h1>
      <ul>
      <li>Identifiant de login : ${email}</li>
      <li>Mot de passe : ${password}</li>
      <li>Comment utiliser ton compte email, voici les infos OVH pour configurer ta boite mail : <a href="https://docs.ovh.com/fr/emails/">https://docs.ovh.com/fr/emails/</a></li>
      <li>Gérer son compte mail sur le secrétariat BetaGouv : <a href="${url}">${url}</a></li>
      </ul>
      <p>🤖 Le secrétariat</p>`;

    try {
      await utils.sendMail(req.body.to_email, `Création compte ${email}`, html);
    } catch (err) {
      throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
    }

    req.flash('message', 'Le compte email a bien été créé.');
    res.redirect(`/community/${id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/community`);
  }
}

module.exports.createRedirectionForUser = async function (req, res) {
  const id = req.params.id;

  try {
    const user = await utils.userInfos(id, req.user.id === id);

    // TODO: généraliser ce code dans un `app.param("id")` ?
    if (!user.userInfos) {
      throw new Error(
        `L'utilisateur·rice ${id} n'a pas de fiche sur Github : vous ne pouvez pas créer de redirection.`
      );
    }

    if (user.isExpired) {
      throw new Error(
        `Le compte de l'utilisateur·rice ${id} est expiré.`
      );
    }

    if (!user.canCreateRedirection) {
      throw new Error("Vous n'avez pas le droit de créer de redirection.");
    }

    console.log(
      `Création d'une redirection d'email id=${req.user.id}&from_email=${id}&to_email=${req.body.to_email}&createRedirection=${req.body.createRedirection}&keep_copy=${req.body.keep_copy}`
    );

    const url = `${config.protocol}://${req.get('host')}`;

    const message = `À la demande de ${req.user.id} sur <${url}>, je crée une redirection mail pour ${id}`;

    try {
      await BetaGouv.sendInfoToSlack(message);
      await BetaGouv.createRedirection(
        utils.buildBetaEmail(id),
        req.body.to_email,
        req.body.keep_copy === 'true'
      );
    } catch (err) {
      throw new Error(`Erreur pour créer la redirection: ${err}`);
    }

    req.flash('message', 'La redirection a bien été créé.');
    res.redirect(`/community/${id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/community/${id}`);
  }
}

module.exports.deleteRedirectionForUser = async function (req, res) {
  const { id, email: to_email } = req.params;

  try {
    const user = await utils.userInfos(id, req.user.id === id);
    // TODO: vérifier si l'utilisateur·rice existe sur Github ?

    if (!user.canCreateRedirection) {
      throw new Error("Vous n'avez pas le droit de supprimer cette redirection.");
    }

    console.log(`Suppression de la redirection by=${id}&to_email=${to_email}`);

    const url = `${config.protocol}://${req.get('host')}`;
    const message = `À la demande de ${req.user.id} sur <${url}>, je supprime la redirection mail de ${id} vers ${to_email}`;

    try {
      await BetaGouv.sendInfoToSlack(message);
      await BetaGouv.deleteRedirection(utils.buildBetaEmail(id), to_email);
    } catch (err) {
      throw new Error(`Erreur pour supprimer la redirection: ${err}`);
    }

    req.flash('message', 'La redirection a bien été supprimée.');
    res.redirect(`/community/${id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/community/${id}`);
  }
}

module.exports.updatePasswordForUser = async function (req, res) {
  const id = req.params.id;

  try {
    const user = await utils.userInfos(id, req.user.id === id);

    if (!user.userInfos) {
      throw new Error(
        `L'utilisateur·rice ${id} n'a pas de fiche sur Github : vous ne pouvez pas modifier le mot de passe.`
      );
    }

    if (user.isExpired) {
      throw new Error(
        `Le compte de l'utilisateur·rice ${id} est expiré.`
      );
    }

    if (!user.canChangePassword) {
      throw new Error("Vous n'avez pas le droit de changer le mot de passe.");
    }

    const password = req.body.new_password;

    if (
      !password ||
      password.length < 9 ||
      password.length > 30 ||
      password !== password.trim()
    ) {
      throw new Error(
        "Le mot de passe doit comporter de 9 à 30 caractères, ne pas contenir d'accents ni d'espace au début ou à la fin."
      );
    }

    const email = utils.buildBetaEmail(id);

    console.log(`Changement de mot de passe by=${req.user.id}&email=${email}`);

    const url = `${config.protocol}://${req.get('host')}`;

    const message = `À la demande de ${req.user.id} sur <${url}>, je change le mot de passe pour ${id}.`;

    await BetaGouv.sendInfoToSlack(message);
    await BetaGouv.changePassword(id, password);

    req.flash('message', 'Le mot de passe a bien été modifié.');
    res.redirect(`/community/${id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/community/${id}`);
  }
}

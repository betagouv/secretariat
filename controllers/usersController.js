const config = require('../config');
const BetaGouv = require('../betagouv');
const userInfos = require('./utils').userInfos;
const buildBetaEmail = require('./utils').buildBetaEmail;
const sendMail = require('./utils').sendMail;

module.exports.get = async function (req, res) {
  if (req.query.name) {
    return res.redirect(`/users/${req.query.name}`);
  }

  try {
    const users = await BetaGouv.usersInfos();

    res.render('search', {
      users: users,
      user: req.user,
      domain: config.domain,
      partials: {
        header: 'header',
        footer: 'footer'
      }
    });
  } catch (err) {
    console.error(err);

    res.render('search', {
      users: [],
      errors: [
        `Erreur interne: impossible de récupérer la liste des membres sur ${config.domain}`
      ],
      user: req.user,
      partials: {
        header: 'header',
        footer: 'footer'
      }
    });
  }
}

module.exports.getByName = async function (req, res) {
  const name = req.params.name;

  try {
    const user = await userInfos(name, req.user.id === name);

    res.render('user', {
      name,
      user: req.user,
      emailInfos: user.emailInfos,
      redirections: user.redirections,
      userInfos: user.userInfos,
      canCreateEmail: user.canCreateEmail,
      canCreateRedirection: user.canCreateRedirection,
      canChangePassword: user.canChangePassword,
      errors: req.flash('error'),
      messages: req.flash('message'),
      domain: config.domain,
      partials: {
        header: 'header',
        footer: 'footer'
      }
    });
  } catch (err) {
    console.error(err);

    res.send(err);
  }
}

module.exports.postEmail = async function (req, res) {
  const id = req.params.id;

  try {
    const user = await userInfos(id, req.user.id === id);

    if (!user.userInfos) {
      throw new Error(
        `L'utilisateur(trice) ${id} n'a pas de fiche sur github : vous ne pouvez pas créer son compte email`
      );
    }

    if (!user.canCreateEmail) {
      throw new Error("Vous n'avez pas le droits de créer le compte email de l'utilisateur");
    }

    const password = Math.random()
      .toString(36)
      .slice(-10);
    const email = buildBetaEmail(id);

    console.log(
      `Création de compte by=${req.user.id}&email=${email}&to_email=${req.body.to_email}&createRedirection=${req.body.createRedirection}&keep_copy=${req.body.keep_copy}`
    );

    const url = `${config.secure ? 'https' : 'http'}://${req.hostname}`;

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
      </a>`;

    try {
      await sendMail(req.body.to_email, `Création compte ${email}`, html);
    } catch (err) {
      throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
    }

    req.flash('message', 'Le compte email a bien été créé');
    res.redirect(`/users/${id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err);
    res.redirect(`/users/${id}`);
  }
}

module.exports.postRedirections = async function (req, res) {
  const id = req.params.id;
  const url = `${config.secure ? 'https' : 'http'}://${req.hostname}`;

  try {
    const user = await userInfos(id, req.user.id === id);

    // TODO: généraliser ce code dans un `app.param("id")` ?
    if (!user.userInfos) {
      throw new Error(
        `L'utilisateur(trice) ${id} n'a pas de fiche sur github : vous ne pouvez pas créer de redirection`
      );
    }

    if (!user.canCreateRedirection) {
      throw new Error("Vous n'avez pas le droits de créer de redirection");
    }

    console.log(
      `Création d'une redirection d'email id=${req.user.id}&from_email=${id}&to_email=${req.body.to_email}&createRedirection=${req.body.createRedirection}&keep_copy=${req.body.keep_copy}`
    );

    const message = `À la demande de ${req.user.id} sur <${url}>, je crée une redirection mail pour ${id}`;

    try {
      await BetaGouv.sendInfoToSlack(message);
      await BetaGouv.createRedirection(
        buildBetaEmail(id),
        req.body.to_email,
        req.body.keep_copy === 'true'
      );
    } catch (err) {
      throw new Error(`Erreur pour créer la redirection: ${err}`);
    }

    req.flash('message', 'La redirection a bien été créé');
    res.redirect(`/users/${id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err);
    res.redirect(`/users/${id}`);
  }
}

module.exports.deleteRedirections = async function (req, res) {
  const { id, email: to_email } = req.params;

  try {
    const user = await userInfos(id, req.user.id === id);
    // TODO: vérifier si l'utilisateur existe sur github ?

    if (!user.canCreateRedirection) {
      throw new Error("Vous n'avez pas le droits de supprimer cette redirection");
    }

    console.log(`Suppression de la redirection by=${id}&to_email=${to_email}`);

    const url = `${config.secure ? 'https' : 'http'}://${req.hostname}`;
    const message = `À la demande de ${req.user.id} sur <${url}>, je supprime la redirection mail de ${id} vers ${to_email}`;

    try {
      await BetaGouv.sendInfoToSlack(message);
      await BetaGouv.deleteRedirection(buildBetaEmail(id), to_email);
    } catch (err) {
      throw new Error(`Erreur pour supprimer la redirection: ${err}`);
    }

    req.flash('message', 'La redirection a bien été supprimé');
    res.redirect(`/users/${id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/users/${id}`);
  }
}

module.exports.postPassword = async function (req, res) {
  const id = req.params.id;

  try {
    const user = await userInfos(id, req.user.id === id);

    if (!user.userInfos) {
      throw new Error(
        `L'utilisateur(trice) ${id} n'a pas de fiche sur github : vous ne pouvez pas modifier le mot de passe`
      );
    }
    console.log(user)
    if (!user.canChangePassword) {
      throw new Error("Vous n'avez pas le droits de changer le mot de passe.");
    }

    const password = req.body.new_password;

    if (
      !password ||
      password.length < 9 ||
      password.length > 30 ||
      password !== password.trim()
    ) {
      throw new Error(
        "Le mot de passe doit comporter de 9 à 30 caractères, ne pas contenir d'accents ni d'espace au début ou à la fin"
      );
    }

    const email = buildBetaEmail(id);

    console.log(`Changement de mot de passe by=${req.user.id}&email=${email}`);

    const url = `${config.secure ? 'https' : 'http'}://${req.hostname}`;

    const message = `À la demande de ${req.user.id} sur <${url}>, je change le mot de passe pour ${id}`;

    await BetaGouv.sendInfoToSlack(message);
    await BetaGouv.changePassword(id, password);

    req.flash('message', 'Le mot de passe a bien été modifié');
    res.redirect(`/users/${id}`);
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    res.redirect(`/users/${id}`);
  }
}

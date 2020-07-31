const jwt = require('jsonwebtoken');
const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');

function renderLogin(req, res, params) {
  params.partials = {
    header: 'header',
    footer: 'footer',
    currentUser: req.user
  };
  params.domain = config.domain;

  return res.render('login', params);
}

async function sendLoginEmail(id, domain) {
  const user = await BetaGouv.userInfosById(id);

  if (!user) {
    throw new Error(
      `Utilisateur(trice) ${id} inconnu(e) sur ${config.domain}. Avez-vous une fiche sur Github ?`
    );
  }

  if (utils.checkUserIsExpired(user)) {
    throw new Error(
      `Utilisateur(trice) ${id} a une date de fin expiré sur Github.`
    );
  }

  const email = utils.buildBetaEmail(id);
  const token = jwt.sign({ id: id }, config.secret, { expiresIn: '1 hours' });
  const url = `${domain}/users?token=${encodeURIComponent(token)}`;
  const html = `
      <h1>Ton lien de connexion ! (Valable 1 heure)</h1>
      <a href="${url}">${url}
      </a>`;

  try {
    await utils.sendMail(email, 'Connexion secrétariat BetaGouv', html);
  } catch (err) {
    console.error(err);

    throw new Error("Erreur d'envoi de mail à ton adresse.");
  }
}

module.exports.getLogin = async function (req, res) {
  try {
    const users = await BetaGouv.usersInfos();

    renderLogin(req, res, { errors: req.flash('error'), users });
  } catch (err) {
    console.error(err);

    renderLogin(req, res, {
      errors: [
        `Erreur interne: impossible de récupérer la liste des membres sur ${config.domain}.`
      ]
    });
  }
}

module.exports.postLogin = async function (req, res) {
  if (
    req.body.id === undefined ||
    !/^[a-z0-9_-]+\.[a-z0-9_-]+$/.test(req.body.id)
  ) {
    req.flash('error', 'Nom invalid ([a-z0-9_-]+.[a-z0-9_-]+)');
    return res.redirect('/login');
  }

  const domain = `${config.secure ? 'https' : 'http'}://${req.hostname}`;

  try {
    const result = await sendLoginEmail(req.body.id, domain);

    renderLogin(req, res, {
      message: `Email de connexion envoyé pour ${req.body.id}.`
    });
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    return res.redirect('/login');
  }
}

const crypto = require('crypto');

const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');
const knex = require('../db');

function renderLogin(req, res, params) {
  // init params
  params.currentUser = undefined;
  params.domain = config.domain;
  // enrich params
  params.errors = req.flash('error');
  params.messages = req.flash('message');
  // render
  return res.render('login', params);
}

function generateToken() {
  return crypto.randomBytes(256).toString('base64');
}

async function sendLoginEmail(id, domain, token) {
  const user = await BetaGouv.userInfosById(id);

  if (!user) {
    throw new Error(
      `Utilisateur·rice ${id} inconnu·e sur ${config.domain}. Avez-vous une fiche sur Github ?`,
    );
  }

  if (utils.checkUserIsExpired(user)) {
    throw new Error(
      `Utilisateur·rice ${id} a une date de fin expiré sur Github.`,
    );
  }

  const email = utils.buildBetaEmail(id);
  const url = `${domain}/users?token=${encodeURIComponent(token)}`;
  const html = `
      <h1>Ton lien de connexion ! (Valable 1 heure)</h1>
      <a href="${url}">${url}</a>
      <p>🤖 Le secrétariat</p>`;

  try {
    await utils.sendMail(email, 'Connexion secrétariat BetaGouv', html);
  } catch (err) {
    console.error(err);
    throw new Error("Erreur d'envoi de mail à ton adresse.");
  }
}

async function saveToken(id, token) {
  const email = utils.buildBetaEmail(id);
  try {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    await knex('login_tokens').insert({
      token,
      username: id,
      email,
      expires_at: expirationDate,
    });
    console.log(`Login token créé pour ${email}`);
  } catch (err) {
    console.error(`Erreur de sauvegarde du token : ${err}`);
    throw new Error('Erreur de sauvegarde du token');
  }
}

module.exports.getLogin = async function (req, res) {
  renderLogin(req, res, {});
};

module.exports.postLogin = async function (req, res) {
  if (
    req.body.id === undefined
    || !/^[a-z0-9_-]+\.[a-z0-9_-]+$/.test(req.body.id)
  ) {
    req.flash('error', 'Nom invalid ([a-z0-9_-]+.[a-z0-9_-]+)');
    return res.redirect('/login');
  }

  const domain = `${config.secure ? 'https' : 'http'}://${req.hostname}`;

  try {
    const token = generateToken();
    await sendLoginEmail(req.body.id, domain, token);
    await saveToken(req.body.id, token);

    renderLogin(req, res, {
      messages: req.flash('message', `Email de connexion envoyé pour <strong>${req.body.id}</strong>`),
    });
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    return res.redirect('/login');
  }
};

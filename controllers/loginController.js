const jwt = require('jsonwebtoken');
const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');
const db = require('../db');
const crypto = require('crypto');

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

async function sendLoginEmail(id, domain) {
  const user = await BetaGouv.userInfosById(id);

  if (!user) {
    throw new Error(
      `Utilisateur·rice ${id} inconnu·e sur ${config.domain}. Avez-vous une fiche sur Github ?`
    );
  }

  if (utils.checkUserIsExpired(user)) {
    throw new Error(
      `Utilisateur·rice ${id} a une date de fin expiré sur Github.`
    );
  }

  const email = utils.buildBetaEmail(id);
  const token = crypto.randomBytes(256).toString('base64');
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

  try {
    let expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);
    await db.query('INSERT INTO login_tokens (token, username, email, expires_at) VALUES ($1, $2, $3, $4)', [
      token,
      id,
      email,
      expirationDate
    ]);
    console.log(`Login token créé pour ${email}`);
  } catch (err) {
    console.error(`Erreur de sauvegarde du token : ${err}`);
    throw new Error(`Erreur de sauvegarde du token`);
  }
}

module.exports.getLogin = async function (req, res) {
  renderLogin(req, res, {});
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
      messages: req.flash('message', `Email de connexion envoyé pour <strong>${req.body.id}</strong>`)
    });
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    return res.redirect('/login');
  }
}

const jwt = require('jsonwebtoken');
const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');
const knex = require('../db');
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

function generateToken() {
  return crypto.randomBytes(256).toString('base64');
}

async function sendLoginEmail(id, domain, token) {
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
  const url = `${domain}/users?token=${encodeURIComponent(token)}`;
  const html = `
      <h1>Lien de connexion au secrétariat BetaGouv</h1>
      <p>Hello !</p>
      <p>Tu as demandé un lien de connexion au secrétariat BetaGouv. 
      Pour t'authentifier, tu dois cliquer sur ce lien dans l'heure qui suit la réception de ce message.</p>

      <p><a href="${url}">${url}</a></p>

      <a href="${url}">
      <button style="margin-bottom: 15px;background: #006be6;padding: 10px;border: none;border-radius: 3px;color: white;min-width: 280px;box-shadow: 1px 1px 2px 0px #333;cursor: pointer;">
        Me connecter
      </button>
    </a>


      <p>Ou utiliser ce lien :<br />a href="${url}">${url}</a></p>

      <p>En cas de problème avec ton compte, n'hésite pas à répondre à ce mail.</p>

      <p>🤖 Le secrétariat</p>`;

  try {
    await utils.sendMail(email, 'Connexion au secrétariat BetaGouv', html);
  } catch (err) {
    console.error(err);
    throw new Error("Erreur d'envoi de mail à ton adresse.");
  }
}

async function saveToken(id, token) {
  const email = utils.buildBetaEmail(id);
  try {
    let expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    await knex('login_tokens').insert({
      token: token,
      username: id,
      email: email,
      expires_at: expirationDate
    });
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
    const token = generateToken()
    await sendLoginEmail(req.body.id, domain, token);
    await saveToken(req.body.id, token)

    renderLogin(req, res, {
      messages: req.flash('message', `Email de connexion envoyé pour <strong>${req.body.id}</strong>`)
    });
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    return res.redirect('/login');
  }
}

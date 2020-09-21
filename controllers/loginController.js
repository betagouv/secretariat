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

async function sendLoginEmail(id, url, token) {
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
  const loginUrl = `${url}/community?token=${encodeURIComponent(token)}`;

  const html = `
      <p>Hello ! 👋</p>
      <p>Tu as demandé un lien de connexion au secrétariat BetaGouv. 
      Pour t'authentifier, tu dois cliquer sur le bouton ci-dessous dans l'heure qui suit la réception de ce message.</p>

      <p>
        <a href="${loginUrl}">
          <button style="margin-bottom: 15px;background: #006be6;padding: 10px;border: none;border-radius: 3px;color: white;min-width: 280px;box-shadow: 1px 1px 2px 0px #333;cursor: pointer;">
            Me connecter
          </button>
        </a>
      </p>

      <p>Ou utiliser ce lien :<br /><a href="${loginUrl}">${loginUrl}</a></p>

      <p>En cas de problème avec ton compte, n'hésite pas à répondre à ce mail !</p>

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
    req.flash('error', "L'email renseigné n'a pas le bon format. Il doit contenir des caractères alphanumériques en minuscule et un '.'.<br />Exemple : charlotte.duret");
    return res.redirect('/login');
  }

  const url = `${config.protocol}://${req.get('host')}`;

  try {
    const token = generateToken()
    await sendLoginEmail(req.body.id, url, token);
    await saveToken(req.body.id, token)

    renderLogin(req, res, {
      messages: req.flash('message', `Un lien de connexion a été envoyé à l'adresse <strong>${req.body.id}@${config.domain}</strong>. Il est valable une heure.`)
    });
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    return res.redirect('/login');
  }
}

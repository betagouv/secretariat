const crypto = require('crypto');
const ejs = require('ejs');

const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('./utils');
const knex = require('../db');

function renderLogin(req, res, params) {
  // init params
  params.currentUser = undefined;
  params.domain = config.domain;
  params.nextParam = req.query.next ? `?next=${req.query.next}` : '';
  // enrich params
  params.errors = req.flash('error');
  params.messages = req.flash('message');
  // render
  return res.render('login', params);
}

function generateToken() {
  return crypto.randomBytes(256).toString('base64');
}

async function sendLoginEmail(email, username, loginUrl, token) {
  const user = await BetaGouv.userInfosById(username);

  if (!user) {
    throw new Error(
      `Membre ${username} inconnu·e sur ${config.domain}. Avez-vous une fiche sur Github ?`,
    );
  }

  if (utils.checkUserIsExpired(user)) {
    throw new Error(
      `Membre ${username} a une date de fin expiré sur Github.`,
    );
  }

  const html = await ejs.renderFile('./views/emails/login.ejs', {
    loginUrlWithToken: `${loginUrl}?token=${encodeURIComponent(token)}`,
  });

  try {
    await utils.sendMail(email, 'Connexion au secrétariat BetaGouv', html);
  } catch (err) {
    console.error(err);
    throw new Error("Erreur d'envoi de mail à ton adresse.");
  }
}

async function saveToken(username, token) {
  const email = utils.buildBetaEmail(username);
  try {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    await knex('login_tokens').insert({
      token,
      username,
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
  const nextParam = req.query.next ? `?next=${req.query.next}` : '';
  const { username, useSecondaryEmail } = req.body;

  if (
    username === undefined
    || !/^[a-z0-9_-]+\.[a-z0-9_-]+$/.test(username)
  ) {
    req.flash('error', "L'email renseigné n'a pas le bon format. Il doit contenir des caractères alphanumériques en minuscule et un '.'.<br /><i>Exemple : charlotte.duret</i>");
    return res.redirect(`/login${nextParam}`);
  }

  const secretariatUrl = `${config.protocol}://${req.get('host')}`;
  const loginUrl = secretariatUrl + (req.query.next || config.defaultLoggedInRedirectUrl);

  try {
    const token = generateToken();

    let email;
    if (useSecondaryEmail) {
      const dbResponse = await knex('users').select('secondary_email').where({ username });
      if (dbResponse.length === 0 || !dbResponse[0].secondary_email) {
        throw new Error(
          `Membre ${username} n'a pas renseigné d'adresse email secondaire. Si tu as perdu l'accès à ton compte email : demande de l'aide sur le Slack #incubateur-secretariat.`,
        );
      }
      email = dbResponse[0].secondary_email;
    } else {
      email = utils.buildBetaEmail(username);
    }

    await sendLoginEmail(email, username, loginUrl, token);
    await saveToken(username, token);

    return renderLogin(req, res, {
      messages: req.flash('message', `Un lien de connexion a été envoyé à l'adresse ${email}. Il est valable une heure.`),
    });
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    return res.redirect(`/login${nextParam}`);
  }
};

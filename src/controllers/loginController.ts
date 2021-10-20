import crypto from 'crypto';
import ejs from 'ejs';
import BetaGouv from '../betagouv';
import config from '../config';
import knex from '../db';
import * as utils from './utils';

function renderLogin(req, res, params) {
  res.render('login', {
    // init params
    currentUser: undefined,
    domain: config.domain,
    nextParam: req.query.next ? `?next=${req.query.next}` : '',
    // enrich params
    errors: req.flash('error'),
    messages: req.flash('message'),
  });
}

function generateToken() {
  return crypto.randomBytes(256).toString('base64');
}

async function sendLoginEmail(email, username, loginUrl, token) {
  const user = await BetaGouv.userInfosById(username);

  if (!user) {
    throw new Error(
      `Membre ${username} inconnu·e sur ${config.domain}. Avez-vous une fiche sur Github ?`
    );
  }

  if (utils.checkUserIsExpired(user)) {
    throw new Error(`Membre ${username} a une date de fin expiré sur Github.`);
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

export async function getLogin(req, res) {
  renderLogin(req, res, {});
}

export async function postLogin(req, res) {
  const nextParam = req.query.next ? `?next=${req.query.next}` : '';
  const { emailInput } = req.body;
  const emailSplit = emailInput.split('@');

  if (!emailInput) {
    req.flash(
      'error',
      `Aucune adresse renseginée.`
    );
    return res.redirect(`/login${nextParam}`);
  }

  let username;
  let secondaryEmail;

  if (emailSplit[1] === config.domain) {
    username = emailSplit[0];
    if (username === undefined || !/^[a-z0-9_-]+\.[a-z0-9_-]+$/.test(username)) {
      req.flash(
        'error',
        `Le nom de l'adresse email renseigné n'a pas le bon format. Il doit contenir des caractères alphanumériques en minuscule et un '.' Exemple : charlotte.duret@${config.domain}`
      );
      return res.redirect(`/login${nextParam}`);
    }
  } else {
      try {
        const dbResponse = await knex('users')
        .select()
        .where({ 'secondary_email': emailInput });
        secondaryEmail = dbResponse[0].secondary_email;
        username = dbResponse[0].username;
      } catch {
        req.flash(
          'error',
          `L'adresse email ${emailInput} n'est pas connue.`
        );
        return res.redirect(`/login${nextParam}`);
      }
  }

  const secretariatUrl = `${config.protocol}://${req.get('host')}`;
  const loginUrl =
    secretariatUrl + (req.query.next || config.defaultLoggedInRedirectUrl);

  try {
    const token = generateToken();
    const email = secondaryEmail ? secondaryEmail : utils.buildBetaEmail(username);

    await sendLoginEmail(email, username, loginUrl, token);
    await saveToken(username, token);

    return renderLogin(req, res, {
      messages: req.flash(
        'message',
        `Un lien de connexion a été envoyé à l'adresse ${email}. Il est valable une heure.`
      ),
    });
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    return res.redirect(`/login${nextParam}`);
  }
}

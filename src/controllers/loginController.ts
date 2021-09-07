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

function censorEmail(email) {
  const username = email.split('@')[0];
  const domainSegments = email.split('@')[1].split('.');
  const topLevelDomain = domainSegments[domainSegments.length - 1];
  const emailHost = domainSegments.slice(0, -1).join('');

  function censorWord(str) {
    return str.length <= 5
      ? str[0] + '*'.repeat(str.length - 1)
      : str[0] + '*'.repeat(str.length - 2) + str.slice(-1);
  }

  return `${censorWord(username)}@${censorWord(emailHost)}.${censorWord(
    topLevelDomain
  )}`;
}

export async function getLogin(req, res) {
  renderLogin(req, res, {});
}

export async function postLogin(req, res) {
  const nextParam = req.query.next ? `?next=${req.query.next}` : '';
  const { username, useSecondaryEmail } = req.body;

  if (username === undefined || !/^[a-z0-9_-]+\.[a-z0-9_-]+$/.test(username)) {
    req.flash(
      'error',
      "L'email renseigné n'a pas le bon format. Il doit contenir des caractères alphanumériques en minuscule et un '.'.<br /><i>Exemple : charlotte.duret</i>"
    );
    return res.redirect(`/login${nextParam}`);
  }

  const secretariatUrl = `${config.protocol}://${req.get('host')}`;
  const loginUrl =
    secretariatUrl + (req.query.next || config.defaultLoggedInRedirectUrl);

  try {
    const token = generateToken();

    let email;
    if (useSecondaryEmail) {
      const dbResponse = await knex('users')
        .select('secondary_email')
        .where({ username });
      if (dbResponse.length === 0 || !dbResponse[0].secondary_email) {
        throw new Error(
          `Ton compte ${utils.buildBetaEmail(
            username
          )} n'a pas d'email secondaire. Si tu ne reçois pas le lien de connexion, tu peux demander de l'aide sur Slack #incubateur-secretariat ou à secretariat@beta.gouv.fr.`
        );
      }
      email = dbResponse[0].secondary_email;
    } else {
      email = utils.buildBetaEmail(username);
    }

    await sendLoginEmail(email, username, loginUrl, token);
    await saveToken(username, token);

    const displayEmail = useSecondaryEmail ? censorEmail(email) : email;
    return renderLogin(req, res, {
      messages: req.flash(
        'message',
        `Un lien de connexion a été envoyé à l'adresse ${displayEmail}. Il est valable une heure.`
      ),
    });
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    return res.redirect(`/login${nextParam}`);
  }
}

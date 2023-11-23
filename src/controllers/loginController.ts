import crypto from 'crypto';
import BetaGouv from '../betagouv';
import config from '@config';
import knex from '../db';
import * as utils from './utils';
import { DBUser, EmailStatusCode } from '@/models/dbUser/dbUser';
import { HomePage } from '../views';
import { sendEmail } from '@/config/email.config';
import { EMAIL_TYPES } from '@/modules/email';
import { isValidEmail } from './validator';
import { getJwtTokenForUser } from '@/helpers/session';

function renderLogin(req, res, params) {
  res.send(
    HomePage({
      request: req,
      errors: req.flash('error'),
      messages: req.flash('message'),
      domain: config.domain,
      next: req.query.next
        ? `?next=${req.query.next}${
            req.query.anchor ? `&anchor=` + req.query.anchor : ''
          }`
        : '',
    })
  );
}

export function generateToken() {
  return crypto.randomBytes(256).toString('base64');
}

async function sendLoginEmail(
  email: string,
  username: string,
  loginUrlWithToken: string
) {
  const user = await BetaGouv.userInfosById(username);
  if (!user) {
    throw new Error(
      `Membre ${username} inconnu·e sur ${config.domain}. Avez-vous une fiche sur Github ?`
    );
  }

  if (utils.checkUserIsExpired(user, 5)) {
    throw new Error(`Membre ${username} a une date de fin expiré sur Github.`);
  }

  try {
    await sendEmail({
      toEmail: [email],
      type: EMAIL_TYPES.LOGIN_EMAIL,
      variables: {
        loginUrlWithToken,
      },
    });
  } catch (err) {
    console.error(err);
    throw new Error("Erreur d'envoi de mail à ton adresse.");
  }
}

export async function saveToken(
  username: string,
  token: string,
  email: string
) {
  try {
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 90); // set duration to 1h30, some users receives emails one hours after

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

export async function postLoginApi(req, res) {
  const formValidationErrors = {};
  const errorHandler = (field, message) => {
    formValidationErrors[field] = message;
  };
  const emailInput =
    req.body.emailInput.toLowerCase() ||
    isValidEmail('email', req.body.emailInput.toLowerCase(), errorHandler);
  if (Object.keys(formValidationErrors).length) {
    return res
      .json({
        errors: formValidationErrors,
      })
      .status(500);
  }
  let username;

  const emailSplit = emailInput.split('@');
  if (emailSplit[1] === config.domain) {
    username = emailSplit[0];
    if (
      username === undefined ||
      !/^[a-z0-9_-]+\.[a-z0-9_-]+$/.test(username)
    ) {
      return res
        .json({
          errors: `Le nom de l'adresse email renseigné n'a pas le bon format. Il doit contenir des caractères alphanumériques en minuscule et un '.' Exemple : charlotte.duret@${config.domain}`,
        })
        .status(500);
    }
  }

  const dbResponse: DBUser = await knex('users')
    .whereRaw(`LOWER(secondary_email) = ?`, emailInput)
    .orWhereRaw(`LOWER(primary_email) = ?`, emailInput)
    .first();

  if (!dbResponse) {
    return res.status(404).json({
      errors: `L'adresse email ${emailInput} n'est pas connue.`,
    });
  }

  if (
    dbResponse.primary_email_status !== EmailStatusCode.EMAIL_ACTIVE &&
    dbResponse.primary_email === emailInput
  ) {
    return res.status(403).json({
      errors: `La personne liée à l'adresse ${emailInput} n'a pas un compte actif. Réglez le problème en utilisant l'interface de diagnostic https://espace-membre.incubateur.net/keskispasse`,
    });
  }

  username = dbResponse.username;

  try {
    const secretariatUrl = `${config.protocol}://${req.get('host')}`;
    const token = generateToken();
    const loginUrl: URL = new URL(secretariatUrl + '/signin' + `#${token}`);
    if (req.query.anchor) {
      loginUrl.searchParams.append('anchor', req.query.anchor);
    }
    loginUrl.searchParams.append(
      'next',
      req.query.next || config.defaultLoggedInRedirectUrl
    );
    await sendLoginEmail(emailInput, username, loginUrl.toString());
    await saveToken(username, token, emailInput);

    return res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    return res.json({
      errors: err.message,
    });
  }
}

export async function postLogin(req, res) {
  const formValidationErrors = {};
  const errorHandler = (field, message) => {
    formValidationErrors[field] = message;
  };
  const next = req.query.next
    ? `?next=${req.query.next}${
        req.query.anchor ? `&anchor=` + req.query.anchor : ''
      }`
    : '';
  const emailInput =
    req.body.emailInput.toLowerCase() ||
    isValidEmail('email', req.body.emailInput.toLowerCase(), errorHandler);
  if (Object.keys(formValidationErrors).length) {
    req.flash('error', formValidationErrors);
    return res.redirect(`/login${next}`);
  }
  let username;

  const emailSplit = emailInput.split('@');
  if (emailSplit[1] === config.domain) {
    username = emailSplit[0];
    if (username === undefined || !/^[a-z0-9_\-\.]+$/.test(username)) {
      req.flash(
        'error',
        `Le nom de l'adresse email renseigné n'a pas le bon format. Il doit contenir des caractères alphanumériques en minuscule et un '.' Exemple : charlotte.duret@${config.domain}`
      );
      return res.redirect(`/login${next}`);
    }
  }

  const dbResponse: DBUser = await knex('users')
    .whereRaw(`LOWER(secondary_email) = ?`, emailInput)
    .orWhereRaw(`LOWER(primary_email) = ?`, emailInput)
    .first();

  if (!dbResponse) {
    req.flash('error', `L'adresse email ${emailInput} n'est pas connue.`);
    return res.redirect(`/login${next}`);
  }

  if (
    dbResponse.primary_email_status !== EmailStatusCode.EMAIL_ACTIVE &&
    dbResponse.primary_email === emailInput
  ) {
    req.flash(
      'error',
      `La personne liée à l'adresse ${emailInput} n'a pas un compte actif. Réglez le problème en utilisant l'interface de diagnostic https://espace-membre.incubateur.net/keskispasse`
    );
    return res.redirect(`/login${next}`);
  }
  username = dbResponse.username;

  try {
    const secretariatUrl = `${config.protocol}://${req.get('host')}`;
    const token = generateToken();
    const loginUrl: URL = new URL(secretariatUrl + '/signin' + `#${token}`);
    if (req.query.anchor) {
      loginUrl.searchParams.append('anchor', req.query.anchor);
    }
    loginUrl.searchParams.append(
      'next',
      req.query.next || config.defaultLoggedInRedirectUrl
    );
    await sendLoginEmail(emailInput, username, loginUrl.toString());
    await saveToken(username, token, emailInput);

    return renderLogin(req, res, {
      messages: req.flash(
        'message',
        `Un lien de connexion a été envoyé à l'adresse ${emailInput}. Il est valable une heure.<br><br>
        <small>⚠️ Sur gmail, les emails peuvent arriver avec un délai.
        Pour les récupérer instantanément aller dans Paramètres ⚙️ → comptes et importation → Consulter d'autres comptes de messagerie → Consulter votre messagerie maintenant.</small>`
      ),
    });
  } catch (err) {
    console.error(err);

    req.flash('error', err.message);
    return res.redirect(`/login${next}`);
  }
}

export function getSignIn(req, res) {
  // if (!req.query.token) {
  //   req.flash('error', `Ce lien de connexion n'est pas valide.`);
  //   res.redirect('/')
  // }
  return res.render('signin', {
    // init params
    next: req.query.next,
    // enrich params
    errors: req.flash('error'),
    messages: req.flash('message'),
  });
}

export async function postSignIn(req, res) {
  if (!req.body.token) {
    req.flash('error', `Ce lien de connexion n'est pas valide.`);
    return res.redirect('/');
  }
  const token = decodeURIComponent(req.body.token);
  try {
    const tokenDbResponse = await knex('login_tokens')
      .select()
      .where({ token })
      .andWhere('expires_at', '>', new Date());

    if (tokenDbResponse.length !== 1) {
      req.flash('error', 'Ce lien de connexion a expiré.');
      return res.redirect('/');
    }

    const dbToken = tokenDbResponse[0];
    if (dbToken.token !== token) {
      req.flash('error', 'Ce lien de connexion a expiré.');
      return res.redirect('/');
    }

    await knex('login_tokens').where({ email: dbToken.email }).del();

    req.session.token = getJwtTokenForUser(dbToken.username);

    if (
      config.FRONT_APP_URL &&
      config.FRONT_APP_EMAIL_TEST.includes(dbToken.username)
    ) {
      return res.redirect(
        config.FRONT_APP_URL +
          (req.body.next || '/account') +
          `${req.query.anchor ? `#` + req.query.anchor : ''}`
      );
    } else {
      return res.redirect(
        `${decodeURIComponent(req.body.next) || '/account'}` +
          `${req.query.anchor ? `#` + req.query.anchor : ''}`
      );
    }
  } catch (err) {
    console.log(`Erreur dans l'utilisation du login token : ${err}`);
    return res.redirect('/');
  }
}

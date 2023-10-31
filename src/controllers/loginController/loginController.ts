import config from '@config';
import knex from '../../db';
import { DBUser, EmailStatusCode } from '@/models/dbUser/dbUser';
import { HomePage } from '../../views';
import { isValidEmail } from '../validator';
import { getJwtTokenForUser } from '@/helpers/session';
import { generateToken, saveToken, sendLoginEmail } from './loginUtils';

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

export async function getLogin(req, res) {
  renderLogin(req, res, {});
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
  console.log('LCS USER', emailInput);
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
    return res.redirect(
      `${decodeURIComponent(req.body.next) || '/account'}` +
        `${req.query.anchor ? `#` + req.query.anchor : ''}`
    );
  } catch (err) {
    console.log(`Erreur dans l'utilisation du login token : ${err}`);
    return res.redirect('/');
  }
}

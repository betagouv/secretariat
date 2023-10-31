import config from '@config';
import knex from '../../db';
import { DBUser, EmailStatusCode } from '@/models/dbUser/dbUser';
import { isValidEmail } from '../validator';
import { generateToken, saveToken, sendLoginEmail } from './loginUtils';

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

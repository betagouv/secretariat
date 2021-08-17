import betagouv from "../betagouv";
import config from "../config";
import knex from "../db";
import * as utils from "./utils";

export async function setEmailResponder(req, res) {
  const formValidationErrors = [];

  function requiredError(field) {
    formValidationErrors.push(`${field} : le champ n'est pas renseigné`);
  }

  function isValidDate(field, date) {
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      return date;
    }
    formValidationErrors.push(`${field} : la date n'est pas valide`);
    return null;
  }

  const { start, end } = req.body;
  const content = req.body.content || requiredError('content')

  const startDate = isValidDate('nouvelle date de fin', new Date(start));
  const endDate = isValidDate('nouvelle date de fin', new Date(end));

  if (startDate && endDate) {
    if (endDate < startDate) {
      formValidationErrors.push('nouvelle date de fin : la date doit être supérieure à la date de début');
    }
  }

  if (formValidationErrors.length) {
    req.flash('error', formValidationErrors);
    throw new Error();
  }

  try {
    if (req.method === 'POST') {
      await betagouv.setResponder(req.user.id, {
        from: startDate,
        to: endDate,
        content
      })
    } else {
      await betagouv.updateResponder(req.user.id, {
        from: startDate,
        to: endDate,
        content
      })
    }
  } catch(err) {
    console.error(err);
    req.flash('error', `Erreur lors de la configuration de la réponse automatique`);
    return res.redirect('/');
  }
  return res.redirect('/account');
}

export async function getCurrentAccount(req, res) {
  try {
    const [currentUser, marrainageState, secondaryEmail] = await Promise.all([
      (async () => utils.userInfos(req.user.id, true))(),
      (async () => {
        const [state] = await knex('marrainage').where({ username: req.user.id });
        return state;
      })(),
      (async () => {
        const rows = await knex('users').where({ username: req.user.id });
        return rows.length === 1 ? rows[0].secondary_email : null;
      })(),
    ]);

    const title = 'Mon compte';
    return res.render('account', {
      title,
      currentUserId: req.user.id,
      emailInfos: currentUser.emailInfos,
      userInfos: currentUser.userInfos,
      domain: config.domain,
      isExpired: currentUser.isExpired,
      canCreateEmail: currentUser.canCreateEmail,
      canCreateRedirection: currentUser.canCreateRedirection,
      canChangePassword: currentUser.canChangePassword,
      canChangeSecondaryEmail: currentUser.canChangeSecondaryEmail,
      redirections: currentUser.redirections,
      secondaryEmail,
      responder: currentUser.responder,
      activeTab: 'account',
      marrainageState,
      formData: {
        newEnd: '',
      },
      responderFormData: currentUser.responder || {
        start: '',
        end: '',
        content: ''
      },
      errors: req.flash('error'),
      messages: req.flash('message'),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Impossible de récupérer vos informations.');
    return res.redirect('/');
  }
}

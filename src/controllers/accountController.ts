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

  const { from, to } = req.body;
  const content = req.body.content || requiredError('content')
  const startDate = isValidDate('nouvelle date de debut', new Date(from));
  const endDate = isValidDate('nouvelle date de fin', new Date(to));

  if (startDate && endDate) {
    if (endDate < startDate) {
      formValidationErrors.push('nouvelle date de fin : la date doit être supérieure à la date de début');
    }
  }

  try {
    if (formValidationErrors.length) {
      req.flash('error', formValidationErrors);
      throw new Error();
    }

    if (req.body.method !== 'update') {
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
    if (err.message) {
      const errors = req.flash('error');
      req.flash('error', [...errors, err.message]);
    }
  }
  return res.redirect('/account');
}

export async function deleteEmailResponder(req, res) {
  try {
    await betagouv.deleteResponder(req.user.id)
  } catch(err) {
    const errorMessage = `Une erreur est intervenue lors de la suppression de la réponse automatique : ${err}`
    console.error(errorMessage);
    req.flash('error', errorMessage);
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
    const today = new Date()
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
      activeTab: 'account',
      marrainageState,
      formData: {
        newEnd: '',
      },
      hasActiveResponder: currentUser.responder && new Date(currentUser.responder.to) >= today && new Date(currentUser.responder.from) <= today,
      hasResponder: Boolean(currentUser.responder),
      responderFormData: currentUser.responder ? { 
        from: new Date(currentUser.responder.from).toISOString().split('T')[0],
        to: new Date(currentUser.responder.to).toISOString().split('T')[0],
        content: currentUser.responder.content
      } : {
        from: new Date().toISOString().split('T')[0],
        to: '',
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

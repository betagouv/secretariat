import betagouv from "../betagouv";
import config from "../config";
import knex from "../db";
import * as utils from "./utils";
import { addEvent, EventCode } from '../lib/events'
import { MemberWithPermission } from "../models/member";
import { DBUser, statusOptions, genderOptions } from "../models/dbUser";
import { EmailStatusCode } from "../models/dbUser";
import { fetchCommuneDetails } from "../lib/searchCommune";

export async function setEmailResponder(req, res) {
  const formValidationErrors: string[] = [];

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
      await betagouv.setResponder(req.auth.id, {
        from: startDate,
        to: endDate,
        content
      })
      addEvent(EventCode.MEMBER_RESPONDER_CREATED, {
        created_by_username: req.auth.id,
        action_on_username: req.auth.id,
        action_metadata: {
          value: content
        }
      })
    } else {
      const responder = await betagouv.getResponder(req.auth.id)
      await betagouv.updateResponder(req.auth.id, {
        from: startDate,
        to: endDate,
        content
      })
      addEvent(EventCode.MEMBER_RESPONDER_UPDATED, {
        created_by_username: req.auth.id,
        action_on_username: req.auth.id,
        action_metadata: {
          value: content,
          old_value: responder.content,
        }
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
    await betagouv.deleteResponder(req.auth.id)
    addEvent(EventCode.MEMBER_RESPONDER_DELETED, {
      created_by_username: req.auth.id,
      action_on_username: req.auth.id
    })
  } catch(err) {
    const errorMessage = `Une erreur est intervenue lors de la suppression de la réponse automatique : ${err}`
    console.error(errorMessage);
    req.flash('error', errorMessage);
  }
  return res.redirect('/account');
}

export async function getCurrentAccount(req, res) {
  try {
    const [currentUser, marrainageState, dbUser] : [MemberWithPermission, string, DBUser] = await Promise.all([
      (async () => utils.userInfos(req.auth.id, true))(),
      (async () => {
        const [state] = await knex('marrainage').where({ username: req.auth.id });
        return state;
      })(),
      (async () => {
        const rows = await knex('users').where({ username: req.auth.id });
        return rows.length === 1 ? rows[0] : null;
      })(),
    ]);
    const today = new Date()
    const title = 'Mon compte';
    const hasPublicServiceEmail = dbUser.primary_email && !dbUser.primary_email.includes(config.domain)
    return res.render('account', {
      title,
      currentUserId: req.auth.id,
      emailInfos: currentUser.emailInfos,
      userInfos: currentUser.userInfos,
      domain: config.domain,
      isExpired: currentUser.isExpired,
      // can create email if email is not set, or if email is not @beta.gouv.fr email
      canCreateEmail: currentUser.canCreateEmail && !hasPublicServiceEmail,
      canCreateRedirection: currentUser.canCreateRedirection,
      canChangePassword: currentUser.canChangePassword,
      emailSuspended: dbUser.primary_email_status === EmailStatusCode.EMAIL_SUSPENDED,
      canChangeEmails: currentUser.canChangeEmails,
      redirections: currentUser.redirections,
      secondaryEmail: dbUser.secondary_email,
      primaryEmail: dbUser.primary_email,
      activeTab: 'account',
      marrainageState,
      formData: {
        gender: dbUser.gender,
        workplace_insee_code: dbUser.workplace_insee_code,
        tjm: dbUser.tjm,
        legal_status: dbUser.legal_status
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

export async function updateCurrentInfo(req, res) {
  const formValidationErrors = {};
  const title = 'Mon compte';
  const [currentUser] : [MemberWithPermission] = await Promise.all([
    (async () => utils.userInfos(req.auth.id, true))(),
  ]);
  try {
    const username = req.auth.id
    const gender = req.body.gender
    const workplace_insee_code = req.body.workplace_insee_code
    const tjm = req.body.tjm;
    const legal_status = req.body.legal_status

    if (legal_status && !statusOptions.map(statusOption => statusOption.key).includes(legal_status)) {
      formValidationErrors['legal_status'] = `Le statut legal n'a pas une valeur autorisé`
    }
    if (gender && !genderOptions.map(genderOption => genderOption.key).includes(gender)) {
      formValidationErrors['gender'] = `Le genre n'a pas une valeur autorisé`
    }
    if (req.body.workplace_insee_code && ! await fetchCommuneDetails(req.body.workplace_insee_code)) {
      formValidationErrors['workplace_insee_code'] = `La lieu de travail principal n'as pas été trouvé`
    }

    if (Object.keys(formValidationErrors).length) {
      req.flash('error', 'Un champs du formulaire est invalide ou manquant.');
      throw new Error();
    }
    await knex('users')
      .update({
        gender,
        workplace_insee_code,
        tjm,
        legal_status,
      })
      .where({ username })
    
    req.flash('message', "Mise à jour")
    res.redirect(`/account/info`);
  } catch (err) {
    if (err.message) {
      req.flash('error', err.message);
    }
    const startups = await betagouv.startupsInfos();
    res.render('info-update', {
      title,
      formValidationErrors,
      currentUserId: req.auth.id,
      startups,
      statusOptions,
      genderOptions,
      currentUser,
      activeTab: 'account',
      communeInfo: req.body.workplace_insee_code ? await fetchCommuneDetails(req.body.workplace_insee_code) : null,
      formData: {
        ...req.body,
      },
      errors: req.flash('error'),
      messages: req.flash('message'),
    });
  }
}

export async function getCurrentInfo(req, res) {
  try {
    const [currentUser, dbUser] : [MemberWithPermission, DBUser] = await Promise.all([
      (async () => utils.userInfos(req.auth.id, true))(),
      (async () => {
        const rows = await knex('users').where({ username: req.auth.id });
        return rows.length === 1 ? rows[0] : null;
      })(),
    ]);
    const title = 'Mon compte';
    const formValidationErrors = {}
    const startups = await betagouv.startupsInfos();
    console.log({
      gender: dbUser.gender,
      workplace_insee_code: dbUser.workplace_insee_code,
      tjm: dbUser.tjm,
      legal_status: dbUser.legal_status
    })
    return res.render('info-update', {
      title,
      formValidationErrors,
      currentUserId: req.auth.id,
      startups,
      genderOptions,
      statusOptions,
      gender: dbUser.gender,
      legal_status: dbUser.legal_status,
      workplace_insee_code: dbUser.workplace_insee_code,
      activeTab: 'account',
      communeInfo: dbUser.workplace_insee_code ? await fetchCommuneDetails(dbUser.workplace_insee_code) : null,
      formData: {
        gender: dbUser.gender,
        workplace_insee_code: dbUser.workplace_insee_code,
        tjm: dbUser.tjm,
        legal_status: dbUser.legal_status
      },
      currentUser,
      errors: req.flash('error'),
      messages: req.flash('message'),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Impossible de récupérer vos informations.');
    return res.redirect('/');
  }
}

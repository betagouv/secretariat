import BetaGouv from "../betagouv";
import config from "@config";
import knex from "../db";
import * as utils from "./utils";
import { requiredError, isValidDate, isValidPhoneNumber } from "@controllers/validator"

const getUserInfoForUsername = (usersInfos, username) => usersInfos.find((userInfo) => userInfo.id === username);

const getFuturVisitsList = async function (usersInfos) {
  const date = new Date(new Date().setDate(new Date().getDate()));
  date.setHours(0, 0, 0, 0);
  const visits = await knex('visits').select()
      .where('date', '>=', date);
  const visitsInfos = visits.map((visitInfo) => ({
    ...visitInfo,
    fullname: visitInfo.fullname,
    date: utils.formatDateToReadableFormat(visitInfo.date),
    referent: (getUserInfoForUsername(usersInfos, visitInfo.referent) || {}).fullname || 'référent supprimé',
  }));
  return visitsInfos;
};

export async function getForm(req, res) {
  try {
    const users = await BetaGouv.usersInfos();

    const title = 'Prévoir une visite';
    return res.render('visit', {
      domain: config.domain,
      title,
      errors: req.flash('error'),
      messages: req.flash('message'),
      userConfig: config.user,
      users,
      currentUserId: req.auth.id,
      formData: {
        visitorList: [],
        referent: '',
        start: new Date().toISOString().split('T')[0], // current date in YYYY-MM-DD format
      },
      visitsInfo: await getFuturVisitsList(users),
      activeTab: 'visit',
      useSelectList: utils.isMobileFirefox(req),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', `Impossible de récupérer la liste des membres sur ${config.domain}`);
    return res.redirect('/');
  }
}

export async function postForm(req, res) {
  try {
    const formValidationErrors = {};
    const errorHandler = (field, message) => {
      formValidationErrors[field] = message
    }
    let visitors = req.body.visitorList || requiredError('visiteurs', errorHandler);
    const referent = req.body.referentUsername || requiredError('référent', errorHandler);
    const number = isValidPhoneNumber('numéro', req.body.number, errorHandler);
    let date = req.body.date || requiredError('date', errorHandler);
    date = isValidDate('date de visite', new Date(date), errorHandler);
    // when only one visitor is sent in the form, visitors is a string
    visitors = Array.isArray(visitors) ? visitors : [visitors];

    if (Object.keys(formValidationErrors).length) {
      req.flash('error', formValidationErrors);
      throw new Error();
    }
    await knex('visits')
      .insert(visitors.map((fullname) => ({
        fullname,
        date,
        number,
        referent,
        requester: req.auth.id,
      })));

    const lastVisitorInList = visitors.pop();
    const dateToDisplay = utils.formatDateToReadableFormat(
      new Date(new Date().setDate(date.getDate() - 1)),
    );
    req.flash('message',
      `La visite a été programmée pour ${visitors.length ? `${visitors.join(', ')} et ` : ''}${lastVisitorInList}.
      Un email sera envoyé à l'accueil Ségur le ${dateToDisplay} (la veille de la visite).`);

    res.redirect('/visit');
  } catch (err) {
    const users = await BetaGouv.usersInfos();
    res.render('visit', {
      errors: req.flash('error'),
      messages: req.flash('message'),
      userConfig: config.user,
      domain: config.domain,
      currentUserId: req.auth.id,
      visitsInfo: await getFuturVisitsList(users),
      users,
      activeTab: 'visit',
      formData: req.body,
      useSelectList: utils.isMobileFirefox(req),
    });
  }
}

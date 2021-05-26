const BetaGouv = require('../betagouv');
const config = require('../config');
const knex = require('../db');
const utils = require('./utils');

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

module.exports.getForm = async function (req, res) {
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
      currentUserId: req.user.id,
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
};

module.exports.postForm = async function (req, res) {
  try {
    const formValidationErrors = [];

    let visitors = req.body.visitorList || utils.requiredError(formValidationErrors, 'visiteurs');
    const referent = req.body.referentUsername || utils.requiredError(formValidationErrors, 'référent');
    const number = utils.isValidNumber(formValidationErrors, 'numéro', req.body.number);
    let date = req.body.date || utils.requiredError(formValidationErrors, 'date');
    date = utils.isValidDate(formValidationErrors, 'date de visite', new Date(date));
    // when only one visitor is sent in the form, visitors is a string
    visitors = Array.isArray(visitors) ? visitors : [visitors];

    if (formValidationErrors.length) {
      req.flash('error', formValidationErrors);
      throw new Error();
    }
    await knex('visits')
      .insert(visitors.map((fullname) => ({
        fullname,
        date,
        number,
        referent,
        requester: req.user.id,
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
      currentUserId: req.user.id,
      visitsInfo: await getFuturVisitsList(users),
      users,
      activeTab: 'visit',
      formData: req.body,
      useSelectList: utils.isMobileFirefox(req),
    });
  }
};

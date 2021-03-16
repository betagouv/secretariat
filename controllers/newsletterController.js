const BetaGouv = require('../betagouv');
const config = require('../config');
const utils = require('./utils');
const knex = require('../db');

const errorMessage = 'Impossible de récupérer les infolettres.';

const formatNewsletterPageData = (req, newsletters, currentNewsletter) => ({
  errors: req.flash('error'),
  messages: req.flash('message'),
  userConfig: config.user,
  domain: config.domain,
  currentUserId: req.user.id,
  currentNewsletter,
  newsletters,
  activeTab: 'newsletter',
});

const updateCurrentNewsletterValidator = async (validator) => {
  let lastNewsletter = await knex('newsletters').orderBy('year_week', 'desc').first();
  if (lastNewsletter) {
    lastNewsletter = await knex('newsletters').where({
      year_week: lastNewsletter.year_week,
    }).update({
      validator,
    }).returning('*');
  }
  return lastNewsletter;
};

const formatNewsletter = (newsletter, usersInfos) => ({
  ...newsletter,
  title: utils.formatDateToFrenchTextReadableFormat(
    utils.getDateOfISOWeek(newsletter.year_week.split('-')[1],
      newsletter.year_week.split('-')[0]),
  ),
  sent_at: newsletter.sent_at
    ? utils.formatDateToReadableDateAndTimeFormat(newsletter.sent_at) : undefined,
  validator: (usersInfos.find((u) => u.id === newsletter.validator) || {}).fullname,
});

module.exports.getNewsletter = async function (req, res) {
  try {
    let newsletters = await knex('newsletters').select().orderBy('year_week', 'desc');
    const usersInfos = await BetaGouv.usersInfos();
    newsletters = newsletters.map((n) => formatNewsletter(n, usersInfos));
    const currentNewsletter = newsletters.shift();
    res.render('newsletter', formatNewsletterPageData(req, newsletters, currentNewsletter));
  } catch (err) {
    console.error(err);
    req.flash('error', errorMessage);
    res.render('newsletter', formatNewsletterPageData(req, []));
  }
};

module.exports.validateNewsletter = async (req, res) => {
  try {
    const currentNewsletter = await updateCurrentNewsletterValidator(req.user.id);
    if (!currentNewsletter) {
      throw new Error('Il n\'y a pas d\'infolettre pour cette semaine');
    }

    req.flash('message', 'L\'infolettre a été validée et sera envoyée ce soir.');
    res.redirect('/newsletters');
  } catch (err) {
    console.error(err);
    req.flash('error', errorMessage);
    res.redirect('/newsletters');
  }
};

module.exports.cancelNewsletter = async (req, res) => {
  try {
    const currentNewsletter = await updateCurrentNewsletterValidator(null);
    if (!currentNewsletter) {
      throw new Error('Il n\'y a pas d\'infolettre pour cette semaine');
    }

    req.flash('message', 'L\'envoie automatique de l\'infolettre a été annulé.');
    res.redirect('/newsletters');
  } catch (err) {
    console.error(err);
    req.flash('error', errorMessage);
    res.redirect('/newsletters');
  }
};

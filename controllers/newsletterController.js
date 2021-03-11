const BetaGouv = require('../betagouv');
const config = require('../config');
const utils = require('./utils');
const knex = require('../db');

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

const getCurrentNewsletterId = () => {
  const date = new Date();
  return `${date.getFullYear()}-${utils.getWeekNumber(date)}`;
};

const getPreviousNewsletters = async () => {
  let newsletters = await knex('newsletters').whereNot({
    year_week: getCurrentNewsletterId(),
  }).select().orderBy('year_week', 'desc');
  const usersInfos = await BetaGouv.usersInfos();
  newsletters = newsletters.map((newsletter) => ({
    ...newsletter,
    sent_at: newsletter.sent_at
      ? utils.formatDateToReadableDateAndTimeFormat(newsletter.sent_at) : undefined,
    title: utils.formatDateToFrenchTextReadableFormat(utils.getDateOfISOWeek(newsletter.year_week.split('-')[1], newsletter.year_week.split('-')[0])),
    validator: (usersInfos.find((u) => u.id === newsletter.validator) || {}).fullname,
  }));
  return newsletters;
};

const updateCurrentNewsletterValidator = async (validator) => {
  const [currentNewsletter] = await knex('newsletters').where({
    year_week: getCurrentNewsletterId(),
  }).update({
    validator,
  }).returning('*');
  return currentNewsletter;
};
// const [firstRow] = await knex('mytable').insert({field: 1}).returning('*');

module.exports.getNewsletter = async function (req, res) {
  try {
    const currentNewsletter = await knex('newsletters').where({
      year_week: getCurrentNewsletterId(),
    }).first();
    const newsletters = await getPreviousNewsletters();

    res.render('newsletter', formatNewsletterPageData(req, newsletters, currentNewsletter));
  } catch (err) {
    console.error(err);
    req.flash('error', 'Impossible de récupérer les newsletters.');
    res.render('newsletter', formatNewsletterPageData(req, []));
  }
};

module.exports.validateNewsletter = async (req, res) => {
  try {
    const currentNewsletter = await updateCurrentNewsletterValidator(req.user.id);
    if (!currentNewsletter) {
      throw new Error('Il n\'y a pas d\'infolettre pour cette semaine');
    }
    const newsletters = await getPreviousNewsletters();

    req.flash('message', 'La newsletter a été validée et sera envoyée ce soir.');
    res.render('newsletter', formatNewsletterPageData(req, newsletters, currentNewsletter));
  } catch (err) {
    console.error(err);
    req.flash('error', 'Impossible de récupérer les infolettres.');
    res.render('newsletter', formatNewsletterPageData(req, []));
  }
};

module.exports.cancelNewsletter = async (req, res) => {
  try {
    const currentNewsletter = await updateCurrentNewsletterValidator(null);
    if (!currentNewsletter) {
      throw new Error('Il n\'y a pas d\'infolettre pour cette semaine');
    }
    const newsletters = await getPreviousNewsletters();

    req.flash('message', 'L\'envoie automatique de la newsletter a été annulé.');
    res.render('newsletter', formatNewsletterPageData(req, newsletters, currentNewsletter));
  } catch (err) {
    console.error(err);
    req.flash('error', 'Impossible de récupérer les infolettres.');
    res.render('newsletter', formatNewsletterPageData(req, []));
  }
};

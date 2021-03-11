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

module.exports.getNewsletter = async function (req, res) {
  try {
    let currentNewsletter = await knex('newsletters').where({
      year_week: getCurrentNewsletterId(),
    }).first();
    if (currentNewsletter) {
      currentNewsletter = {
        ...currentNewsletter,
        title: utils.formatDateToFrenchTextReadableFormat(
          utils.getDateOfISOWeek(currentNewsletter.year_week.split('-')[1],
            currentNewsletter.year_week.split('-')[0]),
        ),
      };
    }
    const newsletters = await getPreviousNewsletters();

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
    const newsletters = await getPreviousNewsletters();

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
    const newsletters = await getPreviousNewsletters();

    req.flash('message', 'L\'envoie automatique de l\'infolettre a été annulé.');
    res.redirect('/newsletters');
  } catch (err) {
    console.error(err);
    req.flash('error', errorMessage);
    res.redirect('/newsletters');
  }
};

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
  let lastNewsletter = await knex('newsletters').orderBy('created_at', 'desc').first();
  if (lastNewsletter && !lastNewsletter.sent_at) {
    lastNewsletter = await knex('newsletters').where({
      id: lastNewsletter.id,
    }).update({
      validator,
    }).returning('*');
  }
  return lastNewsletter;
};

const formatNewsletter = (newsletter) => ({
  ...newsletter,
  title: newsletter.sent_at ? utils.formatDateToFrenchTextReadableFormat(
    newsletter.sent_at,
  ) : utils.formatDateToFrenchTextReadableFormat(
    utils.addDays(utils.getMonday(newsletter.created_at), 7),
  ), // get next monday (date + 7 days),
  sent_at: newsletter.sent_at
    ? utils.formatDateToReadableDateAndTimeFormat(newsletter.sent_at) : undefined,
});

module.exports.getNewsletter = async function (req, res) {
  try {
    let newsletters = await knex('newsletters').select().orderBy('created_at', 'desc');
    newsletters = newsletters.map((newsletter) => formatNewsletter(newsletter));
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

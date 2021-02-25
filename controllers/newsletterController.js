const BetaGouv = require('../betagouv');
const config = require('../config');
const utils = require('./utils');
const knex = require('../db');
const { toPlainObject } = require('lodash');

module.exports.getNewsletter = async function (req, res) {
  try {
    let newsletters = await knex('newsletters').select().orderBy('year_week', 'desc');
    const usersInfos = await BetaGouv.usersInfos();
    newsletters = newsletters.map((newsletter) => ({
      ...newsletter,
      sent_at: newsletter.sent_at
        ? utils.formatDateToReadableDateAndTimeFormat(newsletter.sent_at) : undefined,
      title: utils.formatDateToFrenchTextReadableFormat(utils.getDateOfISOWeek(newsletter.year_week.split('-')[1], newsletter.year_week.split('-')[0])),
      validator: (usersInfos.find((u) => u.id === newsletter.validator) || {}).fullname || 'membre supprimé',
    }));

    res.render('newsletter', {
      errors: req.flash('error'),
      messages: req.flash('message'),
      userConfig: config.user,
      domain: config.domain,
      currentUserId: req.user.id,
      currentNewsletter: newsletters.pop(),
      newsletters,
      activeTab: 'newsletter',
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Impossible de récupérer les newsletters.');
    res.render('newsletter', {
      errors: req.flash('error'),
      messages: req.flash('message'),
      userConfig: config.user,
      domain: config.domain,
      currentUserId: req.user.id,
      currentNewsletter: undefined,
      newsletters: [],
      activeTab: 'newsletter',
    });
  }
};

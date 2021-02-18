const BetaGouv = require('../betagouv');
const config = require('../config');
const utils = require('./utils');
const knex = require('../db');

module.exports.getNewsletter = async function (req, res) {
  let newsletters = await knex('newsletters').select().orderBy('year_week', 'asc');
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
    currentNewsletter: newsletters.pop(0),
    newsletters,
    activeTab: 'newsletter',
  });
};

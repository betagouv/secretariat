const BetaGouv = require('../betagouv');
const config = require('../config');
const utils = require('./utils');
const knex = require('../db');

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
      currentNewsletter: newsletters.shift(),
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

module.exports.validateNewsletter = async (req, res) => {
  try {
    const date = new Date();
    console.log('LCS CURRENT NEWSLETTER 0');
    const currentNewsletter = await knex('newsletters').where({
      year_week: `${date.getFullYear()}-${utils.getWeekNumber(date)}`,
    }).first();
    console.log('LCS CURRENT NEWSLETTER', currentNewsletter);
    if (!currentNewsletter) {
      throw new Error('Il n\'y a pas d\'infolettre pour cette semaine');
    }
    await knex('newsletters').where({
      year_week: `${date.getFullYear()}-${utils.getWeekNumber(date)}`,
    }).update({
      validator: req.user.id,
    });
    console.log(req.user.id);
    let newsletters = await knex('newsletters').select()
      .whereNot({ year_week: `${date.getFullYear()}-${utils.getWeekNumber(date)}` })
      .orderBy('year_week', 'desc');
    console.log(newsletters);
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
      currentNewsletter,
      newsletters,
      activeTab: 'newsletter',
    });
  } catch (err) {
    console.log('LCS CURRENT NEWSLETTER ERROR');
    console.error(err);
    req.flash('error', 'Impossible de récupérer les infolettres.');
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

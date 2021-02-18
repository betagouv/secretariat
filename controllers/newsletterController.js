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
  newsletters = [
    {
      week_year: '2020-54',
      validator: 'julien.dauphant',
      url: 'http://pad.incubateur.com/4924832ad45a',
      sent_at: utils.formatDateToReadableDateAndTimeFormat(new Date()),
      title: utils.formatDateToFrenchTextReadableFormat(utils.getDateOfISOWeek('54', '2020')),
    },
    {
      week_year: '2021-01',
      validator: 'diana.crowle',
      url: 'http://pad.incubateur.com/4924832adsfdsfss4dsa',
      sent_at: utils.formatDateToReadableDateAndTimeFormat(new Date()),
      title: utils.formatDateToFrenchTextReadableFormat(utils.getDateOfISOWeek('01', '2021')),
    },
    {
      week_year: '2021-02',
      validator: 'julien.dauphant',
      url: 'http://pad.incubateur.com/49fdsfs24832ads4dsa',
      sent_at: utils.formatDateToReadableDateAndTimeFormat(new Date()),
      title: utils.formatDateToFrenchTextReadableFormat(utils.getDateOfISOWeek('02', '2021')),
    },
    {
      week_year: '2021-03',
      validator: 'lucas.charrier',
      url: 'http://pad.incubateur.com/49248fdsf32ads4dsa',
      sent_at: utils.formatDateToReadableDateAndTimeFormat(new Date()),
      title: utils.formatDateToFrenchTextReadableFormat(utils.getDateOfISOWeek('03', '2021')),
    },
  ].map((newsletter) => ({
    ...newsletter,
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

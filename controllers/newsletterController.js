const BetaGouv = require('../betagouv');
const config = require('../config');
const utils = require('./utils');
const knex = require('../db');

function getDateOfISOWeek(w, y) {
  const simple = new Date(y, 0, 1 + (w - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
}

module.exports.getNewsletter = async function (req, res) {
  const newsletters = await knex('newsletters').select().orderBy('week_year');
  const usersInfos = await BetaGouv.usersInfos();
  const fakeNewsletter = [
    {
      week_year: '2020-54',
      validator: 'julien.dauphant',
      url: 'http://pad.incubateur.com/4924832ad45a',
      sent_at: utils.formatDateToReadableDateAndTimeFormat(new Date()),
      title: utils.formatDateToFrenchTextReadableFormat(getDateOfISOWeek('54', '2020')),
    },
    {
      week_year: '2021-01',
      validator: 'diana.crowle',
      url: 'http://pad.incubateur.com/4924832adsfdsfss4dsa',
      sent_at: utils.formatDateToReadableDateAndTimeFormat(new Date()),
      title: utils.formatDateToFrenchTextReadableFormat(getDateOfISOWeek('01', '2021')),
    },
    {
      week_year: '2021-02',
      validator: 'julien.dauphant',
      url: 'http://pad.incubateur.com/49fdsfs24832ads4dsa',
      sent_at: utils.formatDateToReadableDateAndTimeFormat(new Date()),
      title: utils.formatDateToFrenchTextReadableFormat(getDateOfISOWeek('02', '2021')),
    },
    {
      week_year: '2021-03',
      validator: 'lucas.charrier',
      url: 'http://pad.incubateur.com/49248fdsf32ads4dsa',
      sent_at: utils.formatDateToReadableDateAndTimeFormat(new Date()),
      title: utils.formatDateToFrenchTextReadableFormat(getDateOfISOWeek('03', '2021')),
    },
  ].map((newsletter) => ({
    ...newsletter,
    validator: (usersInfos.find((u) => u.id === newsletter.validator) || {}).fullname || 'membre supprimé',
  }));
  console.log(fakeNewsletter);

  res.render('newsletter', {
    errors: req.flash('error'),
    messages: req.flash('message'),
    userConfig: config.user,
    domain: config.domain,
    currentUserId: req.user.id,
    currentNewsletter: fakeNewsletter.pop(0),
    newsletters: fakeNewsletter,
    activeTab: 'newsletter',
  });
};

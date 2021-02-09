require('dotenv').config();
const { CronJob } = require('cron');
const ejs = require('ejs');
const config = require('../config');
const BetaGouv = require('../betagouv');
const knex = require('../db');
const utils = require('../controllers/utils');

const getUserInfoForUsername = (usersInfos, username) => usersInfos.find((userInfo) => userInfo.id === username);

const getReferentEmailList = (usersInfos, visits) => {
  const emailList = visits.map((visitInfo) => utils.buildBetaEmail(
    getUserInfoForUsername(usersInfos, visitInfo.referent).id,
  ));
  const uniqueEmailList = Array.from(new Set(emailList));
  return uniqueEmailList;
};

const sendVisitEmail = async function () {
  console.log('Demarrage du cron job pour l\'envoie du message à l\'accueil Ségur');
  const date = new Date(new Date().setDate(new Date().getDate() + 1));
  date.setHours(0, 0, 0, 0);
  const visits = await knex('visits').select()
    .where('date', '=', date);

  if (!visits.length) {
    console.info('Il n\'y a pas de visite prévu');
    return;
  }

  const usersInfos = await BetaGouv.usersInfos();
  const visitsInfos = visits.map((visitInfo) => ({
    ...visitInfo,
    fullname: getUserInfoForUsername(usersInfos, visitInfo.username).fullname,
    referent: getUserInfoForUsername(usersInfos, visitInfo.referent).fullname,
  }));

  const html = await ejs.renderFile('./views/emails/visitEmail.ejs', {
    visitsInfos,
  });

  // @TODO change email accueil@segur.fr to send to
  await utils.sendMail(
    'accueil@segur.fr',
    'Visite à Ségur',
    html,
    {
      cc: getReferentEmailList(usersInfos, visits).join(','),
      from: 'Secrétariat BetaGouv <secretariat@beta.gouv.fr>',
    },

  );

  console.info('L\' email de visite à Ségur a été envoyé');
};

module.exports.sendVisitEmailJob = new CronJob(
  '0 0 18 * * 1-7', // monday through sunday at 18:00:00
  sendVisitEmail,
  null,
  true,
  'Europe/Paris',
);

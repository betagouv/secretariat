require('dotenv').config();
const { CronJob } = require('cron');
const ejs = require('ejs');
const config = require('../config');
const BetaGouv = require('../betagouv');
const knex = require('../db');
const utils = require('../controllers/utils');

const sendVisitEmail = async function () {
  console.log('Demarrage du cron job pour l\'envoie du message à l\'accueil Ségur');
  const date = new Date(new Date().setDate(new Date().getDate() + 1));
  date.setHours(0, 0, 0, 0); // end of day
  const visits = await knex('visit').select()
    .where({ completed: false })
    .where('date', '=', date);

  if (!visits.length) {
    console.info('Il n\'y a pas de visite prévu');
    return;
  }

  const usersInfos = await BetaGouv.usersInfos();
  const visitsInfos = visits.map((v) => ({
    ...v,
    fullname: usersInfos.find((userInfo) => userInfo.id === v.username),
    referent: usersInfos.find((userInfo) => userInfo.id === v.username),
  }));

  const html = await ejs.renderFile('./views/emails/visitEmail.ejs', {
    visitsInfos,
  });

  await utils.sendMail(config.senderEmail, 'Visit à Ségur', html);

  console.info('L\' email de visite à Ségur a été envoyé');
};

module.exports.sendVisitEmailJob = new CronJob(
  '0 0 10 * * 1-5', // monday through friday at 10:00:00
  sendVisitEmail,
  null,
  true,
  'Europe/Paris',
);

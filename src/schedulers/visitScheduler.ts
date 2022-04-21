import { CronJob } from "cron";
import ejs from "ejs";
import config from "../config";
import BetaGouv from "../betagouv";
import knex from "../db";
import * as utils from "../controllers/utils";

const getUserInfoForUsername = (usersInfos, username) => usersInfos.find((userInfo) => userInfo.id === username);

const getReferentEmailList = (usersInfos, visits) => {
  const emailList = visits.map(
    (visitInfo) => getUserInfoForUsername(usersInfos, visitInfo.referent).primary_email
  );
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
    fullname: visitInfo.fullname,
    referent: getUserInfoForUsername(usersInfos, visitInfo.referent).fullname,
  }));

  const html = await ejs.renderFile('./src/views/templates/emails/visitEmail.ejs', {
    visitsInfos,
  });

  // @TODO change destination email to accueil segur
  await utils.sendMail(
    `${config.visitRecipientEmail}`,
    'Visite à Ségur',
    html,
    {
      cc: getReferentEmailList(usersInfos, visits).join(','),
      from: `Secrétariat BetaGouv <${config.visitSenderEmail}>`,
    },

  );

  console.info('L\' email de visite à Ségur a été envoyé');
};

export const sendVisitEmailJob = new CronJob(
  "0 0 18 * * *", // monday through sunday at 18:00:00
  sendVisitEmail,
  null,
  true,
  "Europe/Paris"
);
